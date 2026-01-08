const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // add safe methods here when required
});



