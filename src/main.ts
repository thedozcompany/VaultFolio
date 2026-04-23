import { Notice, Plugin } from "obsidian";

import { VaultFolioSettings, DEFAULT_SETTINGS } from "./settings";
import { Parser, getPublishedNotes, parseNote } from "./parser";
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
        const result = await this.buildSite();
        new Notice(`VaultFolio: built ${result.pageCount} page(s).`);
      },
    });

    this.addCommand({
      id: "deploy-site",
      name: "Deploy to GitHub Pages",
      callback: async () => {
        const result = await this.deploy();
        new Notice(`VaultFolio: ${result.message}`);
      },
    });

    // Defer until metadataCache is fully populated, then parse
    this.app.workspace.onLayoutReady(async () => {
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
      this.settings.portfolioFolder
    );
    const siteNotes = publishedNotes.map((n) => parseNote(n.content, n.path));
    const result = buildSite(siteNotes, this.settings.siteName);

    const outputBase = this.settings.outputFolder.replace(/\/+$/, "");
    const adapter = this.app.vault.adapter;

    for (const dir of [outputBase, `${outputBase}/pages`]) {
      if (!(await adapter.exists(dir))) {
        await adapter.mkdir(dir);
      }
    }

    for (const file of result.files) {
      await adapter.write(`${outputBase}/${file.path}`, file.content);
    }

    return result;
  }

  async deployFiles(files: SiteFile[]): Promise<DeployResult> {
    const filesMap = new Map<string, string>(files.map((f) => [f.path, f.content]));
    return deploySite(filesMap, {
      githubToken: this.settings.githubToken,
      githubRepo: this.settings.githubRepo,
    });
  }

  async deploy(): Promise<DeployResult> {
    const buildResult = await this.buildSite();
    return this.deployFiles(buildResult.files);
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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
