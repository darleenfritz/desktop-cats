// Brücke zwischen den Katzen (renderer.js) und der Menüleiste (main.js)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catsAPI', {
  sendStatus: (status) => ipcRenderer.send('cat-status', status),
});