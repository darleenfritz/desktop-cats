// Hauptprozess: durchsichtiges Fenster, Menüleiste mit Stimmungsanzeige und Tastenkürzel
const path = require('path');
const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, screen, ipcMain } = require('electron');

let win;
let tray;
let latestStatus = null;   // letzte Stimmung der Katzen aus renderer.js
let menuIsOpen = false;    // solange das Menü offen ist, bauen wir es nicht neu

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setIgnoreMouseEvents(true, { forward: true });
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile('index.html');
}

function toggleCats() {
  if (win.isVisible()) {
    win.hide();
  } else {
    win.showInactive();
  }
}

// Balken aus 10 Kästchen, z. B. ▰▰▰▰▱▱▱▱▱▱  40 %
function bar(value) {
  const filled = Math.round(value * 10);
  return '▰'.repeat(filled) + '▱'.repeat(10 - filled) + '  ' + Math.round(value * 100) + ' %';
}

function buildMenu() {
  const items = [];

  if (latestStatus) {
    items.push(
      { label: 'Malia ' + latestStatus.malia.label, enabled: false },
      { label: 'Kuschelbedürfnis  ' + bar(latestStatus.malia.cuddleNeed), enabled: false },
      { type: 'separator' },
      { label: 'Molly ' + latestStatus.molly.label, enabled: false },
      { label: 'Energie  ' + bar(latestStatus.molly.energy), enabled: false },
      { type: 'separator' },
    );
  }

  items.push(
    { label: 'Katzen ein/aus', click: toggleCats },
    { type: 'separator' },
    { label: 'Beenden', click: () => app.quit() },
  );

  const menu = Menu.buildFromTemplate(items);
  menu.on('menu-will-show', () => { menuIsOpen = true; });
  menu.on('menu-will-close', () => { menuIsOpen = false; });
  tray.setContextMenu(menu);
}

// Die Katzen melden ihre Stimmung, dann wird das Menü neu gebaut
ipcMain.on('cat-status', (event, status) => {
  latestStatus = status;
  if (!menuIsOpen) buildMenu();
});

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.hide();

  createWindow();

  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle('🐾');
  buildMenu();

  globalShortcut.register('CommandOrControl+Shift+K', toggleCats);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
