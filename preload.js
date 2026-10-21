const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('docket', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (json) => ipcRenderer.invoke('data:save', json),
  saveFile: (id, ext, buf) => ipcRenderer.invoke('file:save', id, ext, buf),
  deleteFile: (id) => ipcRenderer.invoke('file:delete', id),
  saveAs: (name, buf) => ipcRenderer.invoke('file:saveAs', name, buf),
  openFile: (id, name) => ipcRenderer.invoke('file:open', id, name),
  openFolder: () => ipcRenderer.invoke('folder:open')
});
