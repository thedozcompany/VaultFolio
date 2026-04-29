# VaultFolio — Feature History

A summary of all features integrated across every release.

---

## v0.1.0 — MVP
- Initial release — core plugin functionality

---

## v0.1.1 — Image Support & Bug Fixes
- Image support for pasted images with spaces
- Case-insensitive tag fix
- Apple and Editorial themes added
- Tag filtering on homepage

---

## v0.1.2 — Callouts, Cleanup & Simple Theme
- Callout support (`note`, `warning`, `tip`, `danger`, etc.)
- Stale file cleanup on note rename/delete
- Simple theme added
- Pasted image support fix

---

## v0.1.3 — UI Polish & New Features
- Native Obsidian colors throughout the sidebar
- Theme preview page
- Save Settings button
- Published note count badge
- Better error messages
- First-time user onboarding flow

---

## v0.1.4 — Gallery, Grid/List Toggle & Cover Images
- Cover image support on homepage cards
- Grid / List view toggle on homepage
- Gallery grid/list toggle
- Responsive image grid columns

---

## v0.1.5 — Glassmorphism Theme & Patch Tooling
- Glassmorphism theme (`glass`) added
- Patch scripts and test utilities added

---

## v0.1.6 — GitHub OAuth, show_properties & README Overhaul
- **GitHub OAuth** — connect without a personal access token (uses GitHub Device Flow)
- `show_properties` frontmatter — control which fields display publicly on project pages
- Auto-generated gradients for cards without a cover image
- `description` frontmatter field now displays on project pages
- `coverProperty` setting — use a custom frontmatter key for cover images
- README and INSTALL.md fully overhauled

---

## v0.1.7 — Theme Preview URL Hotfix
- Theme Preview button now points to the correct stable URL

---

## v0.1.8 — Portfolio Folder Scan Fix
- Portfolio folder value is trimmed when saved — whitespace no longer causes notes to vanish
- Parser trims folder value before matching
- Empty folder now fails gracefully instead of silently

---

## Themes Available

| Theme | Key |
|---|---|
| Dark Cinematic | `default` |
| Editorial | `editorial` |
| Apple Minimalist | `apple` |
| Minimal Swiss | `swiss` |
| Simple | `simple` |
| Glassmorphism | `glass` |
