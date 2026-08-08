import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";
import { isDev } from "./util.js";

const DEV_SERVER_URL = "http://localhost:5173";

const MIN_SPLASH_MS = 3000;

ipcMain.handle("titlebar:minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle("titlebar:maximize-toggle", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.handle("titlebar:close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.handle("titlebar:is-maximized", (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
});

app.on("ready", () => {
  Menu.setApplicationMenu(null);

  const splash = new BrowserWindow({
    width: 420,
    height: 460,
    frame: false,
    resizable: false,
    movable: false,
    center: true,
    show: false,
    backgroundColor: "#f3f0e5",
    webPreferences: { devTools: false },
  });
  splash.loadFile(path.join(app.getAppPath(), "dist-electron/splash.html"));
  splash.once("ready-to-show", () => splash.show());

  const mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist-electron/preload.cjs"),
    },
  });

  mainWindow.on("maximize", () =>
    mainWindow.webContents.send("titlebar:maximized-changed", true),
  );
  mainWindow.on("unmaximize", () =>
    mainWindow.webContents.send("titlebar:maximized-changed", false),
  );

  if (isDev()) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
  }

  const minSplashTime = new Promise<void>((resolve) =>
    setTimeout(resolve, MIN_SPLASH_MS),
  );
  const mainWindowReady = new Promise<void>((resolve) =>
    mainWindow.once("ready-to-show", () => resolve()),
  );

  Promise.all([minSplashTime, mainWindowReady]).then(() => {
    splash.destroy();
    mainWindow.show();
  });
});
