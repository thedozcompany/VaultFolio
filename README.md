# VaultFolio

> Turn your Obsidian notes into a live portfolio site.

![Version](https://img.shields.io/badge/version-0.1.1-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Platform](https://img.shields.io/badge/platform-Obsidian-7C3AED)

<!-- Add screenshot here -->

---

## What is VaultFolio

VaultFolio is an Obsidian plugin that converts your vault notes into a fully styled, deployable portfolio website — no coding required. Many developers and designers keep their best work documented in Obsidian but have no easy way to share it publicly. VaultFolio solves that by letting you publish directly to GitHub Pages with one click, straight from inside Obsidian.

---

## Features

- **One-click publish** to GitHub Pages
- **4 themes** — Dark Cinematic, Editorial, Apple Minimalist, Minimal Swiss
- **Local image support** — works with `![[image.png]]` and `![alt](./image.png)`
- **Tag-based filtering** on the homepage
- **Case-insensitive tags**
- **Mobile responsive** output
- **100% free and open source**

---

## Installation

### Option A: Via BRAT (Recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) lets you install plugins that aren't yet in the Obsidian community store.

1. Install the **BRAT** plugin from the Obsidian community plugin store
2. Open BRAT settings → click **Add Beta Plugin**
3. Enter the repository: `thedozcompany/VaultFolio`
4. Click **Add Plugin**
5. Go to **Settings → Community Plugins** and enable **VaultFolio**

### Option B: Manual Install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/thedozcompany/VaultFolio/releases)
2. Create the folder: `<your-vault>/.obsidian/plugins/vaultfolio/`
3. Copy the three files into that folder
4. Open Obsidian → **Settings → Community Plugins** → enable **VaultFolio**

---

## Quick Start

**Step 1 — Configure settings**

Open **Settings → VaultFolio** and fill in:
- GitHub username and repository name
- GitHub Personal Access Token (see [GitHub Setup](#github-setup))
- Site name and description

**Step 2 — Create a portfolio folder**

Create a folder in your vault (e.g. `Portfolio/`) where your published notes will live.

**Step 3 — Create a note with frontmatter**

```yaml
---
title: My Project
published: true
tags: [design, web]
date: 2026-04-25
description: A short description of this project.
---
```

Write your project content below the frontmatter as normal markdown.

**Step 4 — Build the site**

Click **Build Site** in the VaultFolio sidebar panel.

**Step 5 — Deploy to GitHub**

Click **Deploy to GitHub** in the sidebar.

**Step 6 — Enable GitHub Pages**

In your GitHub repository: **Settings → Pages → Source → Deploy from branch → `main` → `/root`** → Save.

**Step 7 — Visit your live site**

Your site will be live at:

```
https://<your-github-username>.github.io/<your-repo-name>/
```

---

## Themes

| Theme | Key | Description |
|---|---|---|
| Dark Cinematic | `default` | Dark luxury cinematic aesthetic |
| Editorial | `editorial` | Magazine-style serif layout |
| Apple Minimalist | `apple` | Clean white minimal design (plugin default) |
| Minimal Swiss | `swiss` | Simple grid-based layout |

Select your theme in **Settings → VaultFolio → Theme**.

---

## GitHub Setup

### Create a Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new **public** repository
3. Leave it empty (no README) — VaultFolio will populate it

### Create a Personal Access Token

1. Go to **GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set an expiry and check the **`repo`** scope
4. Copy the token and paste it into VaultFolio settings

> **Note:** Use a **classic token**, not a fine-grained token. Fine-grained tokens may not have the required permissions for GitHub Pages deployment.

---

## Frontmatter Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Project title displayed on the site |
| `published` | boolean | Yes | Set to `true` to include in the build |
| `tags` | array | No | Tags used for homepage filtering |
| `date` | string | No | Project date in `YYYY-MM-DD` format |
| `description` | string | No | Short summary shown on the project card |

---

## Roadmap

- OAuth GitHub authentication
- Custom domain support
- Analytics dashboard
- Gallery theme for image-heavy portfolios
- Template support
- Obsidian community plugin store listing

---

## Contributing

- Found a bug? [Open an issue](https://github.com/thedozcompany/VaultFolio/issues)
- Have a feature idea? [Open an issue](https://github.com/thedozcompany/VaultFolio/issues)
- Want to contribute code? Pull requests are welcome

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Built By

**Santhosh** — Full stack developer, building in public.

GitHub: [thedozcompany](https://github.com/thedozcompany)
