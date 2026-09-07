<div align="center">

<img src="https://raw.githubusercontent.com/ItzMeShadow999/My-assets/main/chromium.svg" width="150" height="150" alt="Chromium">

# CustomBadges — Extension

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-5E97F6?style=for-the-badge&logo=chromium&logoColor=white)](https://github.com/ItzMeShadow999/CustomBadgesExtc)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-4285F4?style=for-the-badge&logo=chromium&logoColor=white)](manifest.json)
[![License](https://img.shields.io/badge/License-View%20Repo-3367D6?style=for-the-badge&logo=chromium&logoColor=white)](https://github.com/ItzMeShadow999/CustomBadgesExtc)

[![Chrome](https://img.shields.io/badge/Chrome-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](chrome://extensions)
[![Edge](https://img.shields.io/badge/Edge-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white)](edge://extensions)
[![Brave](https://img.shields.io/badge/Brave-FB542B?style=for-the-badge&logo=brave&logoColor=white)](brave://extensions)
[![Opera](https://img.shields.io/badge/Opera-FF1B2D?style=for-the-badge&logo=opera&logoColor=white)](opera://extensions)
[![Vivaldi](https://img.shields.io/badge/Vivaldi-EF3939?style=for-the-badge&logo=vivaldi&logoColor=white)](vivaldi://extensions)

[![Backend](https://img.shields.io/badge/Backend-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white&labelColor=5C6370)](https://custom-badges.shadow-164.workers.dev)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=flat-square&logo=discord&logoColor=white&labelColor=5C6370)](https://discord.gg/uqQv2bXyTd)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square&labelColor=5C6370)](#)

</div>

Cross-client custom profile badges on Discord: tooltips, popup cards, and a toolbar-popup dashboard for editing/publishing your own badge.

> One badge. Every client. Zero exceptions.

Works alongside Vencord, Equicord, BetterDiscord, and plain discord.com.

## Installing on Chromium browsers (Chrome, Edge, Brave, Opera, Vivaldi)

This extension isn't on the Chrome Web Store, so you'll load it as an unpacked extension (developer mode). Takes about a minute.


### 1. Download the extension files

- Click the green **Code** button on this repo → **Download ZIP**, then unzip it somewhere you'll remember.
- Or, if you have git: `git clone https://github.com/ItzMeShadow999/CustomBadgesExtc.git`

### 2. Open your browser's extensions page

| Browser | Address to paste |
|---|---|
| Chrome | `chrome://extensions` |
| Edge | `edge://extensions` |
| Brave | `brave://extensions` |
| Opera | `opera://extensions` |
| Vivaldi | `vivaldi://extensions` |

### 3. Turn on Developer mode

Toggle **Developer mode** on. It's usually a switch in the top-right corner of the extensions page.

### 4. Load the extension

Click **Load unpacked**, then select the folder you unzipped/cloned in step 1 (the one containing `manifest.json`).

The CustomBadges icon should now appear in your toolbar. Pin it for easy access.

### 5. Reload Discord

If Discord was already open in a tab, refresh it so the content script attaches.

## Updating

Pull or re-download the latest files into the same folder, then go back to the extensions page and click the **Reload** (circular arrow) icon on the CustomBadges card.

## Installing on Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select the `manifest.json` file in this folder.
4. Reload any open Discord tabs so the content script attaches.

Temporary add-ons are removed when Firefox restarts. For a persistent installation, the extension must be packaged and signed by Mozilla or installed in a Firefox development build.

## Troubleshooting

- **Icon greyed out / nothing happens on Discord**: make sure the tab is on `discord.com` and hard-refresh (Ctrl/Cmd+Shift+R).
- **"Manifest file is missing or unreadable"**: double-check you selected the folder *containing* `manifest.json`, not a parent or child folder.
- **Extension disappears after a browser restart**: some Chromium browsers periodically disable unpacked extensions for security. Just re-enable it on the extensions page.

## Notes

- Manifest V3, so it's compatible with current Chromium versions.
- Badge data is fetched from the CustomBadges backend at `custom-badges.shadow-164.workers.dev`.
