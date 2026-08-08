import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  minimizeWindow: () => ipcRenderer.invoke("titlebar:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("titlebar:maximize-toggle"),
  closeWindow: () => ipcRenderer.invoke("titlebar:close"),
  isWindowMaximized: (): Promise<boolean> =>
    ipcRenderer.invoke("titlebar:is-maximized"),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const listener = (_event: unknown, isMaximized: boolean) =>
      callback(isMaximized);
    ipcRenderer.on("titlebar:maximized-changed", listener);
    return () =>
      ipcRenderer.removeListener("titlebar:maximized-changed", listener);
  },
  openSalesHistory: () => ipcRenderer.invoke("sales-history:open"),
});
