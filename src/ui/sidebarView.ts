import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import type VaultFolioPlugin from "../main";
import type { PublishedNote } from "../parser";

export const SIDEBAR_VIEW_TYPE = "vaultfolio-sidebar";

export class VaultFolioSidebarView extends ItemView {
  plugin: VaultFolioPlugin;
  private notes: PublishedNote[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: VaultFolioPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return SIDEBAR_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "VaultFolio";
  }

  getIcon(): string {
    return "layout";
  }

  async onOpen(): Promise<void> {
    await this.refresh(false);
  }

  async onClose(): Promise<void> {
    // nothing to clean up
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private async refresh(notify: boolean): Promise<void> {
    this.notes = await this.plugin.parser.getPublishedNotes();
    this.render();
    if (notify) {
      new Notice(`Refreshed. ${this.notes.length} note${this.notes.length === 1 ? "" : "s"} found.`);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  private render(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("vaultfolio-sidebar");

    this.renderHeader(root);
    this.renderNoteList(root);
    this.renderFooter(root);
  }

  private renderHeader(root: HTMLElement): void {
    const header = root.createDiv({ cls: "vaultfolio-header" });

    header.createEl("span", { text: "VaultFolio", cls: "vaultfolio-title" });

    const refreshBtn = header.createEl("button", {
      cls: "vaultfolio-icon-btn",
      attr: { "aria-label": "Refresh notes" },
    });
    refreshBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>`;

    refreshBtn.addEventListener("click", async () => {
      refreshBtn.addClass("vaultfolio-spinning");
      await this.refresh(true);
      refreshBtn.removeClass("vaultfolio-spinning");
    });
  }

  private renderNoteList(root: HTMLElement): void {
    const container = root.createDiv({ cls: "vaultfolio-note-list" });

    if (this.notes.length === 0) {
      container.createDiv({
        cls: "vaultfolio-empty",
        text: "No published notes found. Add published: true to any note in your portfolio folder.",
      });
      return;
    }

    for (const note of this.notes) {
      this.renderNoteCard(container, note);
    }
  }

  private renderNoteCard(container: HTMLElement, note: PublishedNote): void {
    const card = container.createDiv({ cls: "vaultfolio-note-card" });

    card.createDiv({ cls: "vaultfolio-note-title", text: note.title });

    const date = note.frontmatter.date;
    if (typeof date === "string" && date.trim()) {
      card.createDiv({ cls: "vaultfolio-note-date", text: date.trim() });
    }

    const tags = note.frontmatter.tags;
    if (Array.isArray(tags) && tags.length > 0) {
      const tagRow = card.createDiv({ cls: "vaultfolio-tag-row" });
      for (const tag of tags) {
        tagRow.createSpan({ cls: "vaultfolio-tag", text: String(tag) });
      }
    }
  }

  private renderFooter(root: HTMLElement): void {
    const footer = root.createDiv({ cls: "vaultfolio-footer" });

    const buildBtn = footer.createEl("button", {
      text: "Build Site",
      cls: ["vaultfolio-btn", "vaultfolio-btn-primary"],
    });

    const deployBtn = footer.createEl("button", {
      text: "Deploy to GitHub",
      cls: ["vaultfolio-btn", "vaultfolio-btn-secondary"],
    });

    buildBtn.addEventListener("click", async () => {
      buildBtn.disabled = true;
      buildBtn.setText("Building…");
      try {
        const result = await this.plugin.buildSite();
        new Notice(`Site built. ${result.pageCount} page${result.pageCount === 1 ? "" : "s"} generated.`);
      } catch (err) {
        new Notice(`VaultFolio build error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        buildBtn.disabled = false;
        buildBtn.setText("Build Site");
      }
    });

    deployBtn.addEventListener("click", async () => {
      deployBtn.disabled = true;
      deployBtn.setText("Deploying…");
      try {
        const result = await this.plugin.deploy();
        new Notice(`VaultFolio: ${result.message}`);
      } catch (err) {
        new Notice(`VaultFolio deploy error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        deployBtn.disabled = false;
        deployBtn.setText("Deploy to GitHub");
      }
    });
  }
}
