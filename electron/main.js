const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;
let splashWindow;

Menu.setApplicationMenu(null);

function createSplashScreen() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 300,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        center: true,
        webPreferences: { nodeIntegration: false },
    });

    const splashHTML = `<!DOCTYPE html><html><head><style>body{margin:0;padding:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;color:white}.container{text-align:center}.spinner{border:4px solid rgba(255,255,255,0.3);border-top:4px solid white;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}h1{margin:0;font-size:24px}p{margin:10px 0 0;font-size:14px;opacity:0.9}</style></head><body><div class="container"><div class="spinner"></div><h1>Banana POS</h1><p>Loading...</p></div></body></html>`;

    splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
        icon: path.join(__dirname, '../public/icon.png'),
    });

    const url = isDev ? 'http://localhost:9002' : `file://${path.join(__dirname, '../.next/server/app/index.html')}`;
    mainWindow.loadURL(url);

    mainWindow.webContents.on('did-finish-load', () => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
        mainWindow.focus();
    });

    setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.close();
            splashWindow = null;
        }
        mainWindow.show();
    }, 10000);

    mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('print-silent', async (event, options) => {
    const { html, css } = options;

    console.log('📥 Print:', html?.length || 0, 'chars');

    try {
        const printWindow = new BrowserWindow({
            show: false, // Hidden for silent printing
            width: 302, // 80mm in pixels (80mm * 3.78 pixels/mm)
            height: 800,
            webPreferences: { nodeIntegration: false, contextIsolation: true },
        });

        const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:302px auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}html,body{margin:0;padding:0;width:302px;height:auto;overflow-x:hidden}body{width:302px}${css || ''}</style></head><body>${html}</body></html>`;

        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`);

        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 800));

        const printers = await printWindow.webContents.getPrintersAsync();
        const defaultPrinter = printers.find(p => p.isDefault) || printers[0];
        console.log('🖨️ Printer:', defaultPrinter?.name || 'None');

        return new Promise((resolve, reject) => {
            printWindow.webContents.print(
                {
                    silent: true,
                    printBackground: true,
                    deviceName: defaultPrinter?.name || '',
                    margins: {
                        marginType: 'none'
                    },
                    pageSize: {
                        width: 80000, // 80mm in microns
                        height: 297000 // Auto height, using A4 as max
                    }
                },
                (success, errorType) => {
                    // Small delay before closing
                    setTimeout(() => {
                        printWindow.close();
                    }, 300);

                    if (success) {
                        console.log('✅ Print OK');
                        resolve({ success: true });
                    } else {
                        console.error('❌ Print failed:', errorType);
                        reject({ success: false, error: errorType });
                    }
                }
            );
        });
    } catch (error) {
        console.error('💥 Error:', error.message);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('is-desktop', () => true);

app.whenReady().then(() => {
    createSplashScreen();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createSplashScreen();
        createWindow();
    }
});
