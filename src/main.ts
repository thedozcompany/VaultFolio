import { Notice, Plugin } from "obsidian";

import { VaultFolioSettings, DEFAULT_SETTINGS } from "./settings";
import { Parser, getPublishedNotes, parseNote, ImageRef } from "./parser";
import { buildSite, BuildResult, SiteFile } from "./builder";
import { deploySite, DeployResult } from "./deployer";
import { VaultFolioSettingsTab } from "./ui/settingsTab";
import { VaultFolioSidebarView, SIDEBAR_VIEW_TYPE } from "./ui/sidebarView";

export default class VaultFolioPlugin extends Plugin {
  settings!: VaultFolioSettings;
  public parser!: Parser;

  async onload(): Promise<void> {
    console.log("VaultFolio loaded");

    await this.loadSettings();
    this.parser = new Parser(this.app, this.settings);

    // Register sidebar view
    this.registerView(
      SIDEBAR_VIEW_TYPE,
      (leaf) => new VaultFolioSidebarView(leaf, this)
    );

    // Ribbon icon — Phase 1.1 behaviour preserved
    this.addRibbonIcon("layout", "VaultFolio", () => {
      new Notice("VaultFolio is ready");
      this.activateSidebar();
    });

    // Settings tab
    this.addSettingTab(new VaultFolioSettingsTab(this.app, this));

    // Commands
    this.addCommand({
      id: "open-sidebar",
      name: "Open VaultFolio sidebar",
      callback: () => this.activateSidebar(),
    });

    this.addCommand({
      id: "build-site",
      name: "Build site",
      callback: async () => {
        try {
          const result = await this.buildSite();
          new Notice(
            `✅ Site built successfully — ${result.pageCount} page${result.pageCount === 1 ? "" : "s"} generated`
          );
        } catch (err) {
          new Notice(
            `❌ Build failed — ${err instanceof Error ? err.message : "check your portfolio folder"}`
          );
        }
      },
    });

    this.addCommand({
      id: "deploy-site",
      name: "Deploy to GitHub Pages",
      callback: async () => {
        try {
          const result = await this.deploy();
          if (result.success) {
            new Notice(`🚀 Deployed! Visit: ${result.url ?? result.message}`);
          } else {
            const msg = result.message;
            if (msg.includes("Invalid GitHub token") || msg.includes("401")) {
              new Notice("❌ Invalid GitHub token — regenerate in GitHub settings");
            } else {
              new Notice("❌ Deploy failed — check your GitHub token and repo");
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")) {
            new Notice("❌ Network error — check your connection");
          } else {
            new Notice(`❌ Deploy failed — ${msg}`);
          }
        }
      },
    });

    // Defer until metadataCache is fully populated, then parse
    this.app.workspace.onLayoutReady(async () => {
      if (!this.settings.githubRepo) {
        new Notice("👋 Welcome to VaultFolio! Go to Settings → VaultFolio to get started.");
      }
      const notes = await this.parser.getPublishedNotes();
      console.log("Published notes found:", notes.length);
      console.log(notes);
    });
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(SIDEBAR_VIEW_TYPE);
  }

  // ── Public methods used by UI ──────────────────────────────────────────────

  async buildSite(): Promise<BuildResult> {
    const publishedNotes = await getPublishedNotes(
      this.app,
      this.settings.portfolioFolder,
      this.settings.coverProperty
    );
    const siteNotes = publishedNotes.map((n) => parseNote(n.content, n.path, n.frontmatter));
    const result = buildSite(siteNotes, this.settings);

    const outputBase = this.settings.outputFolder.replace(/\/+$/, "");
    const adapter = this.app.vault.adapter;

    for (const dir of [outputBase, `${outputBase}/pages`, `${outputBase}/images`]) {
      if (!(await adapter.exists(dir))) {
        await adapter.mkdir(dir);
      }
    }

    for (const file of result.files) {
      await adapter.write(`${outputBase}/${file.path}`, file.content);
    }

    // Resolve and copy images
    const imageMap = new Map<string, string>(); // deployPath → vaultPath
    for (const note of publishedNotes) {
      for (const ref of note.imageRefs) {
        const vaultPath = this.resolveImageRef(ref, note.path);
        if (!vaultPath) continue;
        const deployPath = `images/${vaultPath.split("/").pop() ?? vaultPath}`;
        if (imageMap.has(deployPath)) continue; // first occurrence wins
        imageMap.set(deployPath, vaultPath);
        if (await adapter.exists(vaultPath)) {
          const binary = await adapter.readBinary(vaultPath);
          await adapter.writeBinary(`${outputBase}/${deployPath}`, binary);
        }
      }
    }

    // Resolve cover images declared in frontmatter (cover: path or cover: ![[image.png]])
    for (const note of publishedNotes) {
      const coverRaw = note.frontmatter.cover as string | undefined;
      if (!coverRaw) continue;
      const trimmed = coverRaw.trim();
      const wikiMatch = trimmed.match(/^!\[\[([^\]|]+)/);
      const coverRef: ImageRef = wikiMatch
        ? { type: "wikilink", path: wikiMatch[1].trim() }
        : { type: "markdown", path: trimmed };
      const vaultPath = this.resolveImageRef(coverRef, note.path);
      if (!vaultPath) continue;
      const deployPath = `images/${vaultPath.split("/").pop() ?? vaultPath}`;
      if (imageMap.has(deployPath)) continue;
      imageMap.set(deployPath, vaultPath);
      if (await adapter.exists(vaultPath)) {
        const binary = await adapter.readBinary(vaultPath);
        await adapter.writeBinary(`${outputBase}/${deployPath}`, binary);
      }
    }

    result.imageMap = imageMap;
    return result;
  }

  async deployFiles(files: SiteFile[], imageMap?: Map<string, string>): Promise<DeployResult> {
    const filesMap = new Map<string, string>(files.map((f) => [f.path, f.content]));

    // Read and base64-encode images for GitHub API
    const imageFiles = new Map<string, string>();
    if (imageMap) {
      for (const [deployPath, vaultPath] of imageMap) {
        try {
          const binary = await this.app.vault.adapter.readBinary(vaultPath);
          imageFiles.set(deployPath, arrayBufferToBase64(binary));
        } catch {
          // skip unreadable images
        }
      }
    }

    return deploySite(
      filesMap,
      { githubToken: this.settings.githubToken, githubRepo: this.settings.githubRepo },
      imageFiles
    );
  }

  async deploy(): Promise<DeployResult> {
    const buildResult = await this.buildSite();
    return this.deployFiles(buildResult.files, buildResult.imageMap);
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private resolveImageRef(ref: ImageRef, notePath: string): string | null {
    if (ref.type === "wikilink") {
      const file = this.app.metadataCache.getFirstLinkpathDest(ref.path, notePath);
      return file?.path ?? null;
    }
    // Markdown: resolve relative to the note's directory
    const noteDir = notePath.includes("/") ? notePath.split("/").slice(0, -1).join("/") : "";
    const clean = ref.path.replace(/^\.\//, "");
    return noteDir ? `${noteDir}/${clean}` : clean;
  }

  private async activateSidebar(): Promise<void> {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfType(SIDEBAR_VIEW_TYPE);

    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: SIDEBAR_VIEW_TYPE, active: true });
      workspace.revealLeaf(leaf);
    }
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
