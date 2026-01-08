const { contextBridge } = require('electron');

// Expose a minimal, safe API to the renderer if needed in the future
contextBridge.exposeInMainWorld('electronAPI', {
  // add safe methods here when required
});



