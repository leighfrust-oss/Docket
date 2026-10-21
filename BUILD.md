# Docket (Windows desktop app, local only)

This is the Docket app as a program for one Windows computer: Documents (drawers, folders, trash, uploads), Status (tasks, concerns, signatures, suppliers), Monthly Report, Document Register, the side calendar with clocks, and search. It needs no internet and no accounts. Everything is saved on this computer.

## Before you start
1. Install **Node.js (LTS version)** from https://nodejs.org. Accept the defaults. Restart the computer if asked.
2. Unzip this folder somewhere simple, for example `C:\Docket-Desktop`.

## Build the installer
1. Open the unzipped folder in File Explorer. Click the address bar, type `cmd`, and press Enter.
2. Type `npm install` and press Enter. Wait until it finishes.
3. **Test first:** type `npm start` and press Enter. The app opens in its own window. Try adding a task in Status and uploading a file in Documents. Close the window when done.
4. **Build:** type `npm run dist` and press Enter. The installer appears in the new `dist` folder, named like `Docket Setup 1.0.0.exe`.
5. Double-click the installer. It adds a Desktop shortcut and a Start menu entry.

If the build shows a "symbolic link" or "winCodeSign" error: turn on Windows **Developer Mode** (Settings, then System or Privacy and security, then For developers), clear `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`, open a new Command Prompt in the folder, and run `npm run dist` again. Or add `"signAndEditExecutable": false` inside the `"win"` section of `package.json` (the program icon may then show the default Electron icon).

Windows may warn "Windows protected your PC" because the installer is not digitally signed. Click **More info**, then **Run anyway**.

## Where your data lives
Everything is in **Documents\Docket**:
- `data.json` has all your records.
- `files` has every uploaded file.
- `backups` has a dated copy of your records for each day (the last 30 days are kept).
- `data.prev.json` is the version from just before the last save.

**Copy the whole `Docket` folder** to a USB drive or an approved location regularly. If this computer fails, that folder is the only copy. The **Backup** tab has an "Open data folder" button.

## Extra features in this local version
- **Monthly Report:** a one-page summary for your manager for any month (signatures waiting, tasks, open concerns, the document register (overdue and upcoming reviews), and the month's reminders). Use the month buttons, then press **Print / Save as PDF** and choose "Microsoft Print to PDF" to save it as a file.
- **Document Register:** one list of your controlled documents (policies, procedures, forms, contracts, memos). Each has a number, title, type, owner, version, status (Draft, In review, Approved, Published, Obsolete), date issued, next review date, and an optional link to the file. Press **Revise** to start a new version (it goes back to Draft and the change is logged), **✓ Reviewed** to move the next review date forward, and click a status card to filter. Review dates turn amber within 30 days and red when overdue, and they also show on the side calendar and Dashboard. **Export CSV** saves what you see. Every status or version change is kept in the document's history.
- **Signature waiting time:** in Status, Signatures now have "Date sent for signature" and "Date signed", and show how many days each one has been waiting (amber after 3 days, red after 7).
- **Security and reminders (Settings tab):** an optional PIN lock that locks the app after minutes without use, and a reminder to download a full backup every few days. The PIN only stops casual snooping and does not encrypt your files, so still use a strong Windows password and BitLocker. If you forget the PIN, it can only be reset by editing `data.json` (remove the `pin` value inside `settings`).

## Colours and pictures (Settings tab)
- **Colour:** pick an accent colour, or use the colour wheel for any colour.
- **Theme from a picture:** choose a photo or wallpaper. Docket finds its main colours, uses the strongest one as the accent, tints the backgrounds to match, and can show the picture behind the app (with a dimming slider so text stays readable). Click any of the found colours to use it instead. Light and dark mode both follow your colours.
- The choice and the picture are saved on this computer only. They are not part of the backup file.
- **Reset colours** returns to the default look.

## Good to know
- There are **no logins**. Anyone who can open the app, or the Docket folder in Documents, can read everything. Protect this computer: use a strong Windows password, lock the screen, and turn on **BitLocker** or Device encryption.
- This version is for one computer. It does not sync between people or computers.
- Clicking a Word, Excel, PDF, or other document opens a **copy** in the program you normally use. Changes made there are not saved back into the app. Pictures, videos, and CSV or text files show in the app's own viewer.
- Programs and scripts (such as .exe) are never run.
- Do not put sensitive customer or account details into the app, and check your organization's rules for where work records may be kept.

## Automatic updates (for the person publishing Docket)
Installed copies check GitHub Releases for a newer version a few seconds after they open, then every few hours. When one is found it downloads quietly and asks "Restart now / Later". User data is never touched. Updates do nothing when you run `npm start`.

One-time setup:
1. Create a free account at https://github.com and a **public** repository named `docket` (a private one needs extra setup).
2. In `package.json`, in the `"publish"` section, replace `YOUR-GITHUB-USERNAME` with your GitHub username.
3. Create an access token: GitHub, Settings, Developer settings, Personal access tokens, Tokens (classic), Generate new token, tick **repo**, copy it.

Publishing a new version (PowerShell, in the Docket folder):
1. Raise `"version"` in `package.json` (for example 1.0.0 to 1.0.1). It must go up every time.
2. `$env:GH_TOKEN="paste-your-token-here"`  (this lasts only for this window)
3. `npm run release`  (builds the installer and uploads it as a draft release)
4. On GitHub, open the repo, Releases, open the draft, and press **Publish release**. Users get it on their next check.

If the upload errors with "401" or "Bad credentials", the token is wrong or lacks the **repo** tick. If it says the repository was not found, check the username and repo name in `package.json`.
Unsigned installers still show the Windows SmartScreen warning, and updates work the same either way.
