// ============================================================
// DEX AI 桌面端 - Electron 主进程
// ============================================================

const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let companionProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    title: 'DEX AI',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (tray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit(); } },
  ]);
  tray.setToolTip('DEX AI');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

function startCompanion() {
  const companionPath = path.join(__dirname, '..', '..', 'dex-companion', 'src', 'index.js');
  companionProcess = spawn('node', [companionPath], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  companionProcess.stdout.on('data', (data) => {
    console.log(`[Companion] ${data.toString().trim()}`);
    if (mainWindow) {
      mainWindow.webContents.send('companion-log', data.toString().trim());
    }
  });

  companionProcess.stderr.on('data', (data) => {
    console.error(`[Companion] ${data.toString().trim()}`);
  });

  companionProcess.on('exit', (code) => {
    console.log(`[Companion] 已退出 (code: ${code})`);
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  startCompanion();
});

app.on('window-all-closed', () => {
  if (companionProcess) companionProcess.kill();
  app.quit();
});

// IPC 处理
ipcMain.handle('get-device-info', () => {
  return {
    version: '1.0.0',
    platform: process.platform,
    arch: process.arch,
  };
});
