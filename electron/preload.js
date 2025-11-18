const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Silent print function
    printSilent: (html, css) => ipcRenderer.invoke('print-silent', { html, css }),

    // Check if running in desktop mode
    isDesktop: () => ipcRenderer.invoke('is-desktop'),

    // Platform info
    platform: process.platform,
});
