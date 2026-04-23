import { App, PluginSettingTab, Setting } from "obsidian";
import type VaultFolioPlugin from "../main";

export class VaultFolioSettingsTab extends PluginSettingTab {
  plugin: VaultFolioPlugin;

  constructor(app: App, plugin: VaultFolioPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "VaultFolio Settings" });

    // --- Site section ---
    containerEl.createEl("h3", { text: "Site" });

    new Setting(containerEl)
      .setName("Site name")
      .setDesc("Displayed as the portfolio heading.")
      .addText((text) =>
        text
          .setPlaceholder("My Portfolio")
          .setValue(this.plugin.settings.siteName)
          .onChange(async (value) => {
            this.plugin.settings.siteName = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Portfolio folder")
      .setDesc("Vault folder containing notes to publish.")
      .addText((text) =>
        text
          .setPlaceholder("portfolio")
          .setValue(this.plugin.settings.portfolioFolder)
          .onChange(async (value) => {
            this.plugin.settings.portfolioFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Output folder")
      .setDesc("Vault folder where the generated site files will be written.")
      .addText((text) =>
        text
          .setPlaceholder("_site")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value) => {
            this.plugin.settings.outputFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Theme")
      .setDesc("Visual theme for the generated site.")
      .addDropdown((drop) =>
        drop
          .addOption("default", "Default")
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings.theme = value;
            await this.plugin.saveSettings();
          })
      );

    // --- GitHub section ---
    containerEl.createEl("h3", { text: "GitHub Deploy" });

    new Setting(containerEl)
      .setName("GitHub repository")
      .setDesc("In owner/repo format, e.g. santhosh/portfolio.")
      .addText((text) =>
        text
          .setPlaceholder("owner/repo")
          .setValue(this.plugin.settings.githubRepo)
          .onChange(async (value) => {
            this.plugin.settings.githubRepo = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("GitHub token")
      .setDesc("Personal access token with repo write permission. Stored locally.")
      .addText((text) => {
        text
          .setPlaceholder("ghp_...")
          .setValue(this.plugin.settings.githubToken)
          .onChange(async (value) => {
            this.plugin.settings.githubToken = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
      });
  }
}
