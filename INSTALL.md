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

---

## Step 2: Install VaultFolio via BRAT

1. Open Obsidian
2. Settings → Community Plugins → BRAT
3. Click "Add Beta Plugin"
4. Paste this URL:
   https://github.com/thedozcompany/VaultFolio
5. Click "Add Plugin"
6. Go back to Community Plugins
7. Find VaultFolio → Enable it

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
3. Name it: my-portfolio
4. Set to Public
5. Click Create repository
6. Add a README file:
   - Click "creating a new file"
   - Name it README.md
   - Type anything
   - Click Commit changes

---

## Step 5: Create a GitHub Token

This lets VaultFolio publish to your GitHub.

1. Go to github.com
2. Click your profile photo → Settings
3. Scroll down → Developer settings
4. Personal access tokens → Tokens (classic)
5. Generate new token (classic)
6. Note: VaultFolio
7. Expiration: No expiration
8. Check the "repo" checkbox
9. Click Generate token
10. COPY THE TOKEN NOW
    (GitHub only shows it once)

---

## Step 6: Configure VaultFolio

1. Open Obsidian
2. Settings → VaultFolio
3. Fill in:
   - Site name: Your name or brand
   - Portfolio folder: portfolio
   - GitHub repository: yourusername/my-portfolio
   - GitHub token: paste token from Step 5
4. Close settings

---

## Step 7: Create Your First Portfolio Note

1. In Obsidian create a new folder called "portfolio"
2. Create a new note inside it
3. Add this at the very top:

'''
---
title: My First Project
published: true
tags: [design, web]
---
'''

Write your project description here.
What did you build? What problem did it solve?

4. Save the note

---

## Step 8: Enable GitHub Pages

1. Go to your GitHub repository
2. Settings tab
3. Left sidebar → Pages
4. Under Branch → select gh-pages
5. Click Save
<img width="1200" height="745" alt="image" src="https://github.com/user-attachments/assets/f2ee6835-8586-4cd8-a8cb-18dc93d81f2f" />

---

## Step 9: Publish Your Portfolio

1. Open Obsidian
2. Click the VaultFolio icon in left sidebar
3. Click "Build Site"
4. Click "Deploy to GitHub"
5. Wait 2-3 minutes
6. Visit:
   https://yourusername.github.io/my-portfolio

Your portfolio is live. 🎉

---

## Troubleshooting

**"Git Repository is empty" error**
→ Go to Step 4 and make sure you added a README file

**"Bad credentials" error**
→ Your GitHub token is wrong. Redo Step 5.

**Site not showing after deploy**
→ Wait 5 minutes. GitHub Pages takes time.
→ Make sure you completed Step 8.

**No notes showing in sidebar**
→ Make sure your note is inside the "portfolio" folder
→ Make sure you added published: true to frontmatter

---

## Need Help?

Comment on the Reddit post or open an issue on GitHub.
https://github.com/thedozcompany/VaultFolio/issues

https://www.reddit.com/r/ObsidianMD/comments/1stnbcx/built_a_plugin_to_publish_obsidian_notes_as_a/
