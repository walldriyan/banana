// src/components/transaction/TransactionDetailsDialog.tsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { X, Printer } from 'lucide-react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { ThermalReceipt } from '../transaction/receipt-templates/ThermalReceipt';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageProvider } from '@/context/LanguageContext';
import type { Company } from '@prisma/client';
import { getCompanyForReceiptAction } from '@/lib/actions/company.actions';
import { useToast } from '@/hooks/use-toast';

const receiptStyles = `
  @page { size: auto; margin: 5px; }
  body { font-family: monospace; background-color: transparent; margin: 0; padding: 0; color: black; }
  .thermal-receipt-container { background-color: transparent; font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto; padding: 8px; overflow-x: hidden; }
  
  html.dark body, html.dark .thermal-receipt-container { 
    background-color: #18181b !important; /* zinc-900 */
    color: #f4f4f5 !important; /* zinc-100 */
  }
  html.dark .border-black { border-color: #f4f4f5; }
  html.dark .text-gray-600 { color: #a1a1aa; } /* zinc-400 */
  html.dark .text-green-700 { color: #86efac; } /* green-300 */
  html.dark .text-blue-700 { color: #93c5fd; } /* blue-300 */
  html.dark .text-red-600 { color: #fca5a5; } /* red-300 */

  .text-center { text-align: center; }
  .space-y-1 > * + * { margin-top: 4px; }
  .text-lg { font-size: 1.125rem; }
  .font-bold { font-weight: 700; }
  .border-t { border-top-width: 1px; }
  .border-dashed { border-style: dashed; }
  .border-black { border-color: black; }
  .my-1 { margin-top: 4px; margin-bottom: 4px; }
  .w-full { width: 100%; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .text-base { font-size: 1rem; }
  .italic { font-style: italic; }
  .text-gray-600 { color: #555; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .text-green-700 { color: #047857; }
  .text-blue-700 { color: #1d4ed8; }
  .text-red-600 { color: #dc2626; }
  .mt-2 { margin-top: 8px; }
  .text-xs { font-size: 0.75rem; }
  .capitalize { text-transform: capitalize; }
`;

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: DatabaseReadyTransaction | null;
  originalTransaction?: DatabaseReadyTransaction | null; 
}

export function TransactionDetailsDialog({
  isOpen,
  onOpenChange,
  transaction,
  originalTransaction,
}: TransactionDetailsDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);

  useEffect(() => {
    if (isOpen) {
      async function fetchCompany() {
        const result = await getCompanyForReceiptAction();
        if (result.success && result.data) {
          setCompanyDetails(result.data);
        } else {
          toast({ variant: 'destructive', title: 'Company Info Missing' });
        }
      }
      fetchCompany();
    }
  }, [isOpen, toast]);

  const handlePrint = async () => {
    if (!transaction) return;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const ReactDOMServer = (await import('react-dom/server')).default;
    const receiptHTML = ReactDOMServer.renderToString(
      <LanguageProvider initialLanguage={language}>
        <ThermalReceipt data={transaction} company={companyDetails} originalTransaction={originalTransaction} />
      </LanguageProvider>
    );

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>${receiptStyles}</style>
          </head>
          <body class="${isDarkMode ? 'dark' : ''}">
            ${receiptHTML}
          </body>
        </html>
      `);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };

  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            A preview of the receipt for transaction ID: {transaction.transactionHeader.transactionId}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 bg-muted p-4 rounded-lg overflow-y-auto max-h-[60vh]">
          <ThermalReceipt data={transaction} company={companyDetails} originalTransaction={originalTransaction} />
        </div>

        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Receipt
            </Button>
        </div>
        <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
