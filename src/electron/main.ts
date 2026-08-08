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

function wireWindowChrome(win: BrowserWindow) {
  win.on("maximize", () => win.webContents.send("titlebar:maximized-changed", true));
  win.on("unmaximize", () => win.webContents.send("titlebar:maximized-changed", false));
}

let salesHistoryWindow: BrowserWindow | null = null;

function openSalesHistoryWindow() {
  if (salesHistoryWindow && !salesHistoryWindow.isDestroyed()) {
    salesHistoryWindow.focus();
    return;
  }

  salesHistoryWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 820,
    minHeight: 560,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist-electron/preload.cjs"),
    },
  });

  wireWindowChrome(salesHistoryWindow);

  if (isDev()) {
    salesHistoryWindow.loadURL(DEV_SERVER_URL + "#/sales-history");
  } else {
    salesHistoryWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"), {
      hash: "/sales-history",
    });
  }

  salesHistoryWindow.once("ready-to-show", () => salesHistoryWindow?.show());
  salesHistoryWindow.on("closed", () => {
    salesHistoryWindow = null;
  });
}

ipcMain.handle("sales-history:open", () => {
  openSalesHistoryWindow();
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

  wireWindowChrome(mainWindow);

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
