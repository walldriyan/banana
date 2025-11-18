// Print Service Abstraction
// Handles both web and desktop printing modes

/**
 * Print receipt - automatically selects web or desktop print method
 * @param html - HTML content to print
 * @param css - Optional CSS styles
 */
export async function printReceipt(html: string, css?: string): Promise<void> {
    const isDesktop = process.env.NEXT_PUBLIC_APP_MODE === 'desktop';

    if (isDesktop && typeof window !== 'undefined' && window.electronAPI) {
        // Desktop mode - silent print via Electron
        try {
            const result = await window.electronAPI.printSilent(html, css);
            if (!result.success) {
                console.error('Silent print failed:', result.error);
                throw new Error(`Print failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Electron print error:', error);
            // Fallback to web print if electron fails
            webPrint(html, css);
        }
    } else {
        // Web mode - dialog print
        webPrint(html, css);
    }
}

/**
 * Web print using iframe method
 */
function webPrint(html: string, css?: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          ${css ? `<style>${css}</style>` : ''}
        </head>
        <body>${html}</body>
      </html>
    `);
        iframeDoc.close();

        const cleanup = () => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        };

        try {
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            }, 500);

            setTimeout(cleanup, 1500);
        } catch (error) {
            console.error('Web print error:', error);
            cleanup();
        }
    }
}

/**
 * Check if running in desktop mode
 */
export function isDesktopMode(): boolean {
    return process.env.NEXT_PUBLIC_APP_MODE === 'desktop';
}

/**
 * Check if silent print is available
 */
export async function isSilentPrintAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (window.electronAPI) {
        try {
            const isDesktop = await window.electronAPI.isDesktop();
            return isDesktop;
        } catch {
            return false;
        }
    }

    return false;
}
