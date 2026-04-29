import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type VaultFolioPlugin from "../main";
import {
  requestDeviceCode,
  pollForToken,
  getGitHubUsername,
  DeviceCodeResponse,
} from "../github-auth";

export class VaultFolioSettingsTab extends PluginSettingTab {
  plugin: VaultFolioPlugin;

  private pollSignal: { cancelled: boolean } | null = null;
  private githubAuthContainer: HTMLDivElement | null = null;
  private connectingStatusEl: HTMLElement | null = null;

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
      .setName("Cover image property")
      .setDesc("Frontmatter property name that holds the cover image (default: cover).")
      .addText((text) =>
        text
          .setPlaceholder("cover")
          .setValue(this.plugin.settings.coverProperty)
          .onChange(async (value) => {
            this.plugin.settings.coverProperty = value;
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

    this.githubAuthContainer = containerEl.createDiv();
    this.githubAuthContainer.style.cssText = "padding: 0 1rem; margin-bottom: 1rem;";
    this.renderGitHubAuth();

    // --- Save button ---
    const saveSeparator = containerEl.createDiv();
    saveSeparator.style.cssText =
      "border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 20px;";

    const saveBtn = saveSeparator.createEl("button", { text: "Save Settings" });
    saveBtn.style.cssText =
      "background: #7C3AED; color: white; border: 1px solid #5B21B6; border-radius: 6px; padding: 10px 5px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; letter-spacing: 0.02em; transition: background 0.15s ease;";

    saveBtn.addEventListener("mouseenter", () => { saveBtn.style.background = "#5B21B6"; });
    saveBtn.addEventListener("mouseleave", () => { saveBtn.style.background = "#7C3AED"; });
    saveBtn.addEventListener("click", async () => {
      await this.plugin.saveSettings();
      new Notice("✅ Settings saved.");
    });
  }

  // ── Auth state rendering ───────────────────────────────────────────────────

  private renderGitHubAuth(): void {
    if (!this.githubAuthContainer) return;
    this.githubAuthContainer.empty();
    this.connectingStatusEl = null;

    if (this.plugin.settings.githubToken) {
      this.renderConnected();
    } else {
      this.renderNotConnected();
    }
  }

  private renderNotConnected(): void {
    const c = this.githubAuthContainer!;

    const connectBtn = c.createEl("button", { text: "Connect GitHub" });
    connectBtn.style.cssText =
      "background: #7C3AED; color: white; border: none; border-radius: 8px; padding: 10px 20px; width: 100%; font-size: 14px; cursor: pointer; margin-bottom: 8px; transition: background 0.15s ease;";
    connectBtn.addEventListener("mouseenter", () => { connectBtn.style.background = "#5B21B6"; });
    connectBtn.addEventListener("mouseleave", () => { connectBtn.style.background = "#7C3AED"; });
    connectBtn.addEventListener("click", () => { void this.startDeviceFlow(); });

    const hint = c.createEl("p", {
      text: "Securely connect via GitHub OAuth. No personal access token needed.",
    });
    hint.style.cssText = "color: var(--text-muted); font-size: 12px; margin: 0;";
  }

  private renderConnecting(deviceData: DeviceCodeResponse): void {
    const c = this.githubAuthContainer!;
    c.empty();
    this.connectingStatusEl = null;

    const card = c.createDiv();
    card.style.cssText =
      "border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 16px; background: var(--background-secondary);";

    // Step 1
    const step1Label = card.createEl("p", { text: "1. Visit this URL in your browser" });
    step1Label.style.cssText = "font-size: 12px; font-weight: 600; margin: 0 0 4px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;";

    const link = card.createEl("a", {
      text: deviceData.verification_uri,
      href: deviceData.verification_uri,
    });
    link.style.cssText = "color: #7C3AED; font-size: 13px; display: block; margin-bottom: 14px; word-break: break-all;";
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");

    // Step 2
    const step2Label = card.createEl("p", { text: "2. Enter this code" });
    step2Label.style.cssText = "font-size: 12px; font-weight: 600; margin: 0 0 4px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em;";

    const codeEl = card.createEl("div", { text: deviceData.user_code });
    codeEl.style.cssText =
      "font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: 0.2em;" +
      "color: #7C3AED; text-align: center; padding: 12px;" +
      "background: var(--background-modifier-hover); border-radius: 6px; margin: 8px 0 14px;";

    // Status line
    const statusEl = card.createEl("p", { text: "Waiting for authorization..." });
    statusEl.style.cssText = "font-size: 12px; color: var(--text-muted); margin: 0 0 10px;";
    this.connectingStatusEl = statusEl;

    // Cancel
    const cancelBtn = card.createEl("button", { text: "Cancel" });
    cancelBtn.style.cssText =
      "background: none; border: none; color: var(--text-muted); font-size: 12px; cursor: pointer; padding: 0; text-decoration: underline;";
    cancelBtn.addEventListener("click", () => {
      if (this.pollSignal) {
        this.pollSignal.cancelled = true;
        this.pollSignal = null;
      }
      this.renderGitHubAuth();
    });
  }

  private renderConnected(): void {
    const c = this.githubAuthContainer!;

    const wrapper = c.createDiv();
    wrapper.style.cssText =
      "display: flex; align-items: center; justify-content: space-between; gap: 12px;" +
      "padding: 12px 16px; border: 1px solid var(--background-modifier-border);" +
      "border-radius: 8px; background: var(--background-secondary);";

    const left = wrapper.createDiv();

    const checkLine = left.createEl("p");
    checkLine.style.cssText =
      "display: flex; align-items: center; gap: 6px; margin: 0 0 2px; font-size: 14px; font-weight: 500; color: var(--text-normal);";
    const checkMark = checkLine.createEl("span", { text: "✓" });
    checkMark.style.cssText = "color: #22c55e; font-weight: 700;";
    checkLine.createEl("span", { text: "Connected to GitHub" });

    const username = this.plugin.settings.githubUsername;
    if (username) {
      const sub = left.createEl("p", { text: `Authorized as @${username}` });
      sub.style.cssText = "margin: 0; font-size: 12px; color: var(--text-muted);";
    }

    const disconnectBtn = wrapper.createEl("button", { text: "Disconnect" });
    disconnectBtn.style.cssText =
      "background: none; border: none; color: var(--text-muted); font-size: 12px;" +
      "cursor: pointer; text-decoration: underline; flex-shrink: 0;";
    disconnectBtn.addEventListener("click", async () => {
      this.plugin.settings.githubToken = "";
      this.plugin.settings.githubUsername = "";
      await this.plugin.saveSettings();
      new Notice(
        "Disconnected from GitHub. To fully revoke access, visit GitHub → Settings → Applications → Authorized OAuth Apps."
      );
      this.renderGitHubAuth();
    });
  }

  // ── Device flow orchestration ──────────────────────────────────────────────

  private async startDeviceFlow(): Promise<void> {
    let deviceData: DeviceCodeResponse;

    try {
      deviceData = await requestDeviceCode();
    } catch {
      new Notice("Unable to connect to GitHub. Check your internet connection.");
      return;
    }

    // Open browser automatically
    window.open(deviceData.verification_uri, "_blank");

    // Switch UI to connecting state
    this.renderConnecting(deviceData);

    // Kick off polling
    const signal = { cancelled: false };
    this.pollSignal = signal;

    try {
      const token = await pollForToken(
        deviceData.device_code,
        deviceData.interval,
        (status) => this.updateConnectingStatus(status),
        signal
      );

      if (signal.cancelled) return;

      this.plugin.settings.githubToken = token;
      await this.plugin.saveSettings();

      const username = await getGitHubUsername(token);
      this.plugin.settings.githubUsername = username;
      await this.plugin.saveSettings();

      new Notice("✅ Connected to GitHub!");

      if (this.githubAuthContainer?.isConnected) {
        this.renderGitHubAuth();
      }
    } catch (err) {
      if (signal.cancelled || (err instanceof Error && err.message === "cancelled")) return;

      const msg =
        err instanceof Error ? err.message : "Authorization failed. Please try again.";
      new Notice(msg);
      this.updateConnectingStatus(msg);

      if (this.githubAuthContainer?.isConnected) {
        // Give user a moment to read the error then restore the Connect button
        setTimeout(() => {
          if (this.githubAuthContainer?.isConnected) this.renderGitHubAuth();
        }, 3000);
      }
    } finally {
      if (this.pollSignal === signal) this.pollSignal = null;
    }
  }

  private updateConnectingStatus(status: string): void {
    if (this.connectingStatusEl) {
      this.connectingStatusEl.textContent = status;
    }
  }
}
