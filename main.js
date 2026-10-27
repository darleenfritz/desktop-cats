// Hauptprozess: erstellt das durchsichtige Fenster, das Menüleisten-Symbol und das Tastenkürzel
const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, screen } = require('electron');

let win;
let tray;

function createWindow() {
  // Größe des Bildschirms ohne Menüleiste und Dock
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,   // durchsichtiger Hintergrund
    frame: false,        // keine Titelleiste
    hasShadow: false,
    alwaysOnTop: true,   // liegt immer über anderen Fenstern
    resizable: false,
    skipTaskbar: true,
    focusable: false,    // nimmt anderen Programmen nicht den Fokus weg
  });

  // Klicks gehen durch das Fenster hindurch, damit du normal weiterarbeiten kannst
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

app.whenReady().then(() => {
  // Kein Symbol im Dock, die App lebt nur in der Menüleiste
  if (process.platform === 'darwin') app.dock.hide();

  createWindow();

  // Menüleisten-Symbol (vorerst nur ein Emoji, später ein kleines Katzen-Icon)
  tray = new Tray(nativeImage.createEmpty());
  tray.setTitle('🐾');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Katzen ein/aus', click: toggleCats },
    { type: 'separator' },
    { label: 'Beenden', click: () => app.quit() },
  ]));

  // Tastenkürzel: Cmd + Shift + K
  globalShortcut.register('CommandOrControl+Shift+K', toggleCats);
});

app.on('will-quit', () => globalShortcut.unregisterAll());
