export {};

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isWindowMaximized: () => Promise<boolean>;
      onWindowMaximizedChange: (
        callback: (isMaximized: boolean) => void,
      ) => () => void;
    };
  }
}
