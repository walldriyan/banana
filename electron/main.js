const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

// Remove default menubar
Menu.setApplicationMenu(null);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
        icon: path.join(__dirname, '../public/icon.png'),
    });

    // Load the Next.js app
    const url = isDev
        ? 'http://localhost:9002'
        : `file://${path.join(__dirname, '../out/index.html')}`;

    mainWindow.loadURL(url);

    // DevTools disabled for silent print testing
    // Uncomment to enable: mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Silent print handler with default printer
ipcMain.handle('print-silent', async (event, options) => {
    const { html, css } = options;

    try {
        // Create a hidden window for printing
        const printWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        // Load the HTML content
        const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${css || ''}</style>
        </head>
        <body>${html}</body>
      </html>
    `;

        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHTML)}`);

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get list of printers to find default
        const printers = await printWindow.webContents.getPrintersAsync();
        const defaultPrinter = printers.find(printer => printer.isDefault);

        // Print silently to default printer (no dialog)
        return new Promise((resolve, reject) => {
            printWindow.webContents.print(
                {
                    silent: true,
                    printBackground: true,
                    deviceName: defaultPrinter?.name || '', // Use default printer
                    margins: {
                        marginType: 'none'
                    }
                },
                (success, errorType) => {
                    printWindow.close();

                    if (success) {
                        resolve({ success: true });
                    } else {
                        reject({ success: false, error: errorType });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Print error:', error);
        return { success: false, error: error.message };
    }
});

// Check if app is in desktop mode
ipcMain.handle('is-desktop', () => {
    return true;
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
