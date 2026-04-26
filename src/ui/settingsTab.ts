import { App, Notice, PluginSettingTab, Setting } from "obsidian";
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
      .setDesc("Displayed as your portfolio heading.")
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
      .setDesc("Folder in your vault containing notes to publish.")
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
      .setDesc("Local folder where HTML files are written.")
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
      .setDesc("Visual style for your generated site.")
      .addDropdown((drop) =>
        drop
          .addOption("default", "Dark Cinematic (Default)")
          .addOption("apple", "Apple Minimalist")
          .addOption("simple", "Simple")
          .addOption("glass", "Glassmorphism")
          .setValue(this.plugin.settings.theme)
          .onChange(async (value) => {
            this.plugin.settings.theme = value;
            await this.plugin.saveSettings();
          })
      );

    const previewLink = containerEl.createEl("a", { text: "Preview all themes →" });
    previewLink.style.cssText =
      "color: #7C3AED; font-size: 12px; cursor: pointer; display: inline-block; margin: -0.5rem 0 1rem 0; padding: 0 1rem; text-decoration: none;";
    previewLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.open("https://thedozcompany.github.io/vaultfolio-portfolio/theme-preview.html", "_blank");
    });

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
      .setDesc("Format: username/repository-name")
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
      .setDesc("Classic token with repo scope. Never shared outside your machine.")
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

    const tokenWarning = containerEl.createEl("p", {
      text: "⚠️ Use a classic token with repo scope only. Fine-grained tokens are not supported.",
    });
    tokenWarning.style.cssText =
      "color: #FF4D00; font-size: 0.8rem; margin: -0.5rem 0 1.5rem 0; padding: 0 1rem; line-height: 1.5;";

    // --- Save button ---
    const saveSeparator = containerEl.createDiv();
    saveSeparator.style.cssText =
      "border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 20px;";

    const saveBtn = saveSeparator.createEl("button", { text: "Save Settings" });
    saveBtn.style.cssText =
      "background: #7C3AED; color: white; border: 1px solid #5B21B6; border-radius: 6px; padding: 10px 5px; font-size: 13px; font-weight: 500; cursor: pointer;  display: flex;  letter-spacing: 0.02em; transition: background 0.15s ease;";

    saveBtn.addEventListener("mouseenter", () => { saveBtn.style.background = "#5B21B6"; });
    saveBtn.addEventListener("mouseleave", () => { saveBtn.style.background = "#7C3AED"; });
    saveBtn.addEventListener("click", async () => {
      await this.plugin.saveSettings();
      new Notice("✅ Settings saved.");
    });
  }
}
