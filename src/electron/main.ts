import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import { isDev } from "./util.js";

const DEV_SERVER_URL = "http://localhost:5173";

app.on("ready", () => {
  Menu.setApplicationMenu(null);
  const mainWindow = new BrowserWindow({});

  if (isDev()) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
  }
});
