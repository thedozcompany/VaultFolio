export interface VaultFolioSettings {
  portfolioFolder: string;
  outputFolder: string;
  githubRepo: string;
  githubToken: string;
  siteName: string;
  theme: string;
  navLinks: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  quoteText: string;
}

export const DEFAULT_SETTINGS: VaultFolioSettings = {
  portfolioFolder: "portfolio",
  outputFolder: "_site",
  githubRepo: "",
  githubToken: "",
  siteName: "My Portfolio",
  theme: "apple",
  navLinks: "Work: #work",
  heroTitle: "Pro. Beyond.",
  heroSubtitle: "Welcome to my digital portfolio.",
  aboutText: "I'm a designer and developer building scalable, beautiful web applications.",
  quoteText: "\"The details are not the details. They make the design.\""
};
