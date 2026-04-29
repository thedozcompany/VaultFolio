# VaultFolio — Install Guide

No coding experience needed. Follow each step exactly.

---

## Step 1: Install BRAT Plugin

BRAT lets you install plugins that aren't in the 
official Obsidian store yet.

1. Open Obsidian
2. Settings → Community Plugins
3. Turn off Safe Mode
4. Click Browse
5. Search "BRAT"
6. Install it
7. Enable it

<img width="274" height="327" alt="image" src="https://github.com/user-attachments/assets/0753d4c2-dfa1-4322-b3b9-08d9d13197ee" />

<img width="723" height="295" alt="image" src="https://github.com/user-attachments/assets/87e9584d-e0d8-47ce-a999-b6ac3281750c" />

---

## Step 2: Install VaultFolio via BRAT

1. Open Obsidian
2. Settings → Community Plugins → BRAT
3. Click "Add Beta Plugin"
4. Paste this URL:
   https://github.com/thedozcompany/VaultFolio
5. Click "Add Plugin"
6. Go back to Community Plugins
7. Enable VaultFolio

<img width="1091" height="812" alt="image" src="https://github.com/user-attachments/assets/20b76826-9c5c-45f3-b3d5-b50bd6f4d112" />
<img width="549" height="409" alt="image" src="https://github.com/user-attachments/assets/eb7976d7-0fa1-4e88-b0ae-9d184b476783" />

---

## Step 3: Create a GitHub Account

Skip this if you already have one.

1. Go to github.com
2. Sign up for free
3. Verify your email

---

## Step 4: Create a GitHub Repository

This is where your portfolio will live.

1. Go to github.com
2. Click the + icon → New repository
3. Name it (e.g. `my-portfolio`)
   - To host at `username.github.io`, name it `username.github.io`
   - Any other name will host at `username.github.io/my-portfolio`
4. Set to **Public**
5. Check **Add a README file**
6. Click Create repository

<img width="589" height="213" alt="image" src="https://github.com/user-attachments/assets/924a943e-d8cd-4ae7-ac88-8dedfaa5266a" />
<img width="838" height="937" alt="image" src="https://github.com/user-attachments/assets/367d9f7f-0637-4856-aaee-33c7f21fd1ad" />

---

## Step 5: Connect GitHub

VaultFolio connects to GitHub securely using OAuth — no token or password needed.

1. Open Obsidian
2. Settings → VaultFolio
3. Click **Connect GitHub**
4. A code like `XXXX-XXXX` will appear — copy it
5. Visit [github.com/login/device](https://github.com/login/device) in your browser
6. Enter the code → click **Authorize VaultFolio**
7. Return to Obsidian — you'll see **Connected ✓**

---

## Step 6: Configure VaultFolio

1. Open Obsidian
2. Settings → VaultFolio
3. Fill in:
   - **Site name**: Your name or brand
   - **Portfolio folder**: `portfolio` (or any folder name you prefer)
   - **GitHub repository**: `yourusername/my-portfolio`
4. Click **Save Settings**

---

## Step 7: Create Your First Portfolio Note

1. In Obsidian, create a new folder called `portfolio`
2. Create a new note inside it
3. Add this at the very top of the note:

```yaml
---
title: My First Project
published: true
description: A short description of your project
tags: [design, web]
---
```

4. Write your project content below the frontmatter
5. Save the note

<img width="228" height="189" alt="image" src="https://github.com/user-attachments/assets/1804a0ce-e6aa-4dd2-8a96-7ce81be41bb8" />
<img width="322" height="281" alt="image" src="https://github.com/user-attachments/assets/329ec6cd-89a3-45a5-b62d-a547613f31e6" />

---

## Step 8: Build and Deploy

1. Open Obsidian
2. Click the VaultFolio icon in the left sidebar
3. If your note doesn't appear, click **Refresh**
4. Click **Build Site**
5. Click **Deploy to GitHub**
6. Wait 2-3 minutes for GitHub to process

<img width="1692" height="1318" alt="image" src="https://github.com/user-attachments/assets/ab8b7c0a-82e3-4a2c-8b2c-5117a1944a10" />
<img width="807" height="131" alt="image" src="https://github.com/user-attachments/assets/a9110323-ce07-422f-b606-634be0dcf3e7" />

---

## Step 9: Enable GitHub Pages

Do this once after your first deploy.

1. Go to your GitHub repository
2. Click the **Settings** tab
3. Left sidebar → **Pages**
4. Under Branch → select **gh-pages**
5. Click **Save**

<img width="749" height="518" alt="image" src="https://github.com/user-attachments/assets/8bf23e16-d520-40a7-a98d-30ec75efabec" />

Wait 2-3 minutes. Your portfolio will be live at:

```
https://yourusername.github.io/my-portfolio
```

---

## Troubleshooting

**"Git Repository is empty" error**
→ Go to Step 4 and make sure you checked "Add a README file" when creating the repo

**OAuth code expired**
→ Codes expire after 15 minutes. Go to Settings → VaultFolio → Connect GitHub and start again

**Authorization failed / not connected**
→ Make sure you clicked **Authorize VaultFolio** on the GitHub device page, not just entered the code

**Site not showing after deploy**
→ Wait 5 minutes. GitHub Pages takes time on first deploy.
→ Make sure you completed Step 9 (enable gh-pages branch)

**No notes showing in sidebar**
→ Make sure your note is inside the `portfolio` folder
→ Make sure you added `published: true` to the frontmatter

---

## Need Help?

Open an issue on GitHub or comment on the Reddit post.

https://github.com/thedozcompany/VaultFolio/issues

https://www.reddit.com/r/ObsidianMD/comments/1stnbcx/built_a_plugin_to_publish_obsidian_notes_as_a/
