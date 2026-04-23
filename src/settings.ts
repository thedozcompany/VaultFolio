export interface VaultFolioSettings {
  portfolioFolder: string;
  outputFolder: string;
  githubRepo: string;
  githubToken: string;
  siteName: string;
  theme: string;
}

export const DEFAULT_SETTINGS: VaultFolioSettings = {
  portfolioFolder: "portfolio",
  outputFolder: "_site",
  githubRepo: "",
  githubToken: "",
  siteName: "My Portfolio",
  theme: "default",
};
