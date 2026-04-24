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
          .addOption("default", "Dark Cinematic (Default)")
          .addOption("editorial", "Editorial")
          .addOption("apple", "Apple Minimalist")
          .addOption("swiss", "Minimal Swiss")
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings.theme = value;
            await this.plugin.saveSettings();
          })
      );

    // --- Site Content section ---
    containerEl.createEl("h3", { text: "Site Content" });

    new Setting(containerEl)
      .setName("Nav Menu Links")
      .setDesc("Format: 'Label: URL, Label: URL' (e.g. 'Work: #work, About: #about')")
      .addTextArea((text) =>
        text
          .setPlaceholder("Work: #work, GitHub: https://github.com/...")
          .setValue(this.plugin.settings.navLinks)
          .onChange(async (value) => {
            this.plugin.settings.navLinks = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Hero Title")
      .setDesc("The main large text on the homepage.")
      .addText((text) =>
        text
          .setPlaceholder("Pro. Beyond.")
          .setValue(this.plugin.settings.heroTitle)
          .onChange(async (value) => {
            this.plugin.settings.heroTitle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Hero Subtitle")
      .setDesc("The text below the main hero title.")
      .addTextArea((text) =>
        text
          .setPlaceholder("Welcome to my digital portfolio.")
          .setValue(this.plugin.settings.heroSubtitle)
          .onChange(async (value) => {
            this.plugin.settings.heroSubtitle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("About Text")
      .setDesc("Text shown in the About section (HTML supported).")
      .addTextArea((text) =>
        text
          .setPlaceholder("I'm a designer and developer...")
          .setValue(this.plugin.settings.aboutText)
          .onChange(async (value) => {
            this.plugin.settings.aboutText = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Quote Text")
      .setDesc("Quote displayed above the footer.")
      .addTextArea((text) =>
        text
          .setPlaceholder('"The details are not the details. They make the design."')
          .setValue(this.plugin.settings.quoteText)
          .onChange(async (value) => {
            this.plugin.settings.quoteText = value;
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
