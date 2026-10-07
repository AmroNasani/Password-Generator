const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const uiPath = path.join(__dirname, '../ui/index.html');
const uiURL = pathToFileURL(uiPath).href;

function createWindow() {
  const window = new BrowserWindow({
    width: 720, height: 740, minWidth: 380, minHeight: 700,
    backgroundColor: '#f2f3f8', title: 'Password Generator',
    icon: path.join(__dirname, '../ui/icons/icon.png'),
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.loadFile(uiPath);
}

app.whenReady().then(() => {
  const allowPermission = (webContents, permission) =>
    permission === 'clipboard-sanitized-write' && webContents?.getURL() === uiURL;
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => callback(allowPermission(webContents, permission)));
  session.defaultSession.setPermissionCheckHandler(allowPermission);
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
