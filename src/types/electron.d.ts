// Electron API Type Definitions

interface ElectronAPI {
    printSilent: (html: string, css?: string) => Promise<{ success: boolean; error?: string }>;
    isDesktop: () => Promise<boolean>;
    platform: string;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
