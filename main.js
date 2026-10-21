const {app, BrowserWindow, ipcMain, dialog, protocol, net, shell, nativeTheme} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'docketfile', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, bypassCSP: true } }
]);

let win, ROOT, FILES, BAK, DATA;

function setup() {
  ROOT = path.join(app.getPath('documents'), 'Docket');
  FILES = path.join(ROOT, 'files');
  BAK = path.join(ROOT, 'backups');
  DATA = path.join(ROOT, 'data.json');
  [ROOT, FILES, BAK].forEach((d) => fs.mkdirSync(d, { recursive: true }));
}

const idOk = (id) => typeof id === 'string' && /^[a-f0-9]{32}$/.test(id);
const findFile = (id) => (idOk(id) ? fs.readdirSync(FILES).find((f) => f.startsWith(id)) : null);

function writeAtomic(p, txt) {
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, txt);
  fs.renameSync(tmp, p);
}

function dailyBackup(txt) {
  const d = new Date();
  const name = 'data-' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '.json';
  fs.writeFileSync(path.join(BAK, name), txt);
  const all = fs.readdirSync(BAK).filter((f) => /^data-.*\.json$/.test(f)).sort();
  while (all.length > 30) fs.unlinkSync(path.join(BAK, all.shift()));
}

const RISKY = ['.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.ps1', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.lnk', '.reg', '.hta', '.jar'];

ipcMain.handle('data:load', () => (fs.existsSync(DATA) ? fs.readFileSync(DATA, 'utf8') : null));

ipcMain.handle('data:save', (e, json) => {
  if (typeof json !== 'string') return false;
  if (fs.existsSync(DATA)) fs.copyFileSync(DATA, path.join(ROOT, 'data.prev.json'));
  writeAtomic(DATA, json);
  dailyBackup(json);
  return true;
});

ipcMain.handle('file:save', (e, id, ext, buf) => {
  if (!idOk(id) || !/^(\.[a-z0-9]{1,8})?$/.test(ext)) throw new Error('Invalid file');
  fs.writeFileSync(path.join(FILES, id + ext), Buffer.from(buf));
  return true;
});

ipcMain.handle('file:delete', (e, id) => {
  const f = findFile(id);
  if (f) fs.unlinkSync(path.join(FILES, f));
  return true;
});

ipcMain.handle('file:saveAs', async (e, name, buf) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: path.basename(String(name)) });
  if (r.canceled || !r.filePath) return false;
  fs.writeFileSync(r.filePath, Buffer.from(buf));
  return true;
});

ipcMain.handle('file:open', async (e, id, name) => {
  const f = findFile(id);
  if (!f) return false;
  const dir = path.join(os.tmpdir(), 'docket-open');
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, path.basename(String(name)).replace(/[<>:"/\\|?*]/g, '_'));
  fs.copyFileSync(path.join(FILES, f), out);
  if (RISKY.includes(path.extname(out).toLowerCase())) shell.showItemInFolder(out);
  else await shell.openPath(out);
  return true;
});

ipcMain.handle('folder:open', () => shell.openPath(ROOT));

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f1218' : '#f7f8fa',
    title: 'Docket',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(() => {
    app.setAppUserModelId('com.docket.desktop');
    setup();
    protocol.handle('docketfile', async (req) => {
      const id = new URL(req.url).pathname.slice(1, 33);
      const f = findFile(id);
      if (!f) return new Response('Not found', { status: 404 });
      const r = await net.fetch(pathToFileURL(path.join(FILES, f)).toString());
      return new Response(r.body, {
        status: r.status,
        headers: {
          'content-type': r.headers.get('content-type') || 'application/octet-stream',
          'access-control-allow-origin': '*'
        }
      });
    });
    createWindow();
    startUpdates();
  });
  app.on('window-all-closed', () => app.quit());
}

/* Auto-update: checks GitHub Releases when the installed app starts. Does nothing in dev (npm start). */
function startUpdates() {
  if (!app.isPackaged) return;
  let au;
  try { au = require('electron-updater').autoUpdater; } catch (e) { return; }
  au.autoDownload = true;
  au.autoInstallOnAppQuit = true;
  au.on('error', () => {});
  au.on('update-downloaded', (info) => {
    dialog.showMessageBox(win, {
      type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1,
      title: 'Docket update', message: 'Docket ' + info.version + ' is ready.',
      detail: 'Restart to finish updating. Your data is not affected.'
    }).then(r => { if (r.response === 0) au.quitAndInstall(); });
  });
  const check = () => { try { au.checkForUpdates().catch(() => {}); } catch (e) {} };
  setTimeout(check, 8000);
  setInterval(check, 6 * 60 * 60 * 1000);
}
