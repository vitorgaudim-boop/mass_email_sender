import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, shell } from 'electron';
import dotenv from 'dotenv';
import { DatabaseService } from './services/database.js';
import { EmailService } from './services/emailService.js';
import { QueueManager } from './services/queueManager.js';
import { registerIpcHandlers } from './ipc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function getRendererPath() {
  return path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
}

function loadEnvironment() {
  const candidatePaths = [
    path.join(process.cwd(), '.env'),
    path.join(path.dirname(app.getPath('exe')), '.env'),
    path.join(app.getPath('userData'), '.env')
  ];

  for (const candidatePath of candidatePaths) {
    if (!fs.existsSync(candidatePath)) {
      continue;
    }

    dotenv.config({
      path: candidatePath,
      override: false
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#f7f1ef',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('Renderer load failed:', {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log('Renderer console:', {
      level,
      message,
      line,
      sourceId
    });
  });

  mainWindow.webContents.on('did-finish-load', async () => {
    try {
      const diagnostics = await mainWindow.webContents.executeJavaScript(`
        ({
          hasEnvioApi: typeof window.envioApi,
          rootExists: Boolean(document.getElementById('root')),
          rootHtmlLength: document.getElementById('root')?.innerHTML?.length ?? 0,
          documentTitle: document.title
        })
      `);
      console.log('Renderer diagnostics:', diagnostics);
    } catch (error) {
      console.error('Renderer diagnostics failed:', error);
    }
  });

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(getRendererPath());
  }
}

app.whenReady().then(() => {
  loadEnvironment();

  const database = new DatabaseService(path.join(app.getPath('userData'), 'envio-de-email.sqlite'));
  database.initialize();

  const emailService = new EmailService({
    env: {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      SENDGRID_BASE_URL: process.env.SENDGRID_BASE_URL || 'https://api.sendgrid.com'
    }
  });
  const queueManager = new QueueManager({ database, emailService });

  registerIpcHandlers({
    database,
    queueManager
  });

  queueManager.on('progress', (payload) => {
    mainWindow?.webContents.send('campaign:progress', payload);
  });

  queueManager.on('log', (payload) => {
    mainWindow?.webContents.send('campaign:log', payload);
    console.log(`[${payload.level}] ${payload.message}`);
  });

  queueManager.on('error', (payload) => {
    mainWindow?.webContents.send('campaign:error', payload);
    console.error(payload.message);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
