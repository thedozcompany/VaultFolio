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
3. Name it (for example): my-portfolio or anything you want to call your blog. Note that if you want to locate your blog in the  username.github.io, you can also name the repository directly as username.github.io. If you call it my-portfolio or something similar, it will be located in username.github.io/my-portfolio
4. Set to Public (default option)
5. Click Create repository
6. Add a README file:
   - Click "creating a new file"
   - Name it README.md
   - Type anything
   - Click Commit changes
<img width="589" height="213" alt="image" src="https://github.com/user-attachments/assets/924a943e-d8cd-4ae7-ac88-8dedfaa5266a" />
<img width="838" height="937" alt="image" src="https://github.com/user-attachments/assets/367d9f7f-0637-4856-aaee-33c7f21fd1ad" />

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

<img width="1268" height="609" alt="image" src="https://github.com/user-attachments/assets/d26eb550-5fcd-4a61-a033-dcf1ee856d49" />

---

## Step 6: Configure VaultFolio

1. Open Obsidian
2. Settings → VaultFolio
3. Fill in:
   - Site name: Your name or brand
   - Portfolio folder: portfolio (or anything else you like)
   - GitHub repository: yourusername/my-portfolio
   - GitHub token: paste token from Step 5
4. Close settings

---

## Step 7: Create Your First Portfolio Note

1. In Obsidian create a new folder called "portfolio"
2. Create a new note inside it
3. Add this at the very top of the note:
```yaml
---
title: My First Project
published: true
tags: [design, web]
---
```
Add your post content here.

4. Save the note
<img width="228" height="189" alt="image" src="https://github.com/user-attachments/assets/1804a0ce-e6aa-4dd2-8a96-7ce81be41bb8" />
<img width="322" height="281" alt="image" src="https://github.com/user-attachments/assets/329ec6cd-89a3-45a5-b62d-a547613f31e6" />

---

## Step 9: First publication

1. Open Obsidian
2. Click the VaultFolio icon in left sidebar
3. (If you cannot see the new posts, click on Refresh button)
4. Click "Build Site"
5. Click "Deploy to GitHub"
6. Wait 2-3 minutes, you will see a branch in your github.
<img width="1692" height="1318" alt="image" src="https://github.com/user-attachments/assets/ab8b7c0a-82e3-4a2c-8b2c-5117a1944a10" />
<img width="807" height="131" alt="image" src="https://github.com/user-attachments/assets/a9110323-ce70-422f-b606-634be0dcf3e7" />

---

## Step 8: Enable GitHub Pages

1. Go to your GitHub repository
2. Settings tab
3. Left sidebar → Pages
4. Under Branch → select gh-pages
5. Click Save - important!

<img width="749" height="518" alt="image" src="https://github.com/user-attachments/assets/8bf23e16-d520-40a7-a98d-30ec75efabec" />

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
