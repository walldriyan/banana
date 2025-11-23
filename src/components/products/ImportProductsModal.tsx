// src/components/products/ImportProductsModal.tsx
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { UploadCloud, File, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportProductsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportProductsModal({ isOpen, onOpenChange, onSuccess }: ImportProductsModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast({ variant: 'destructive', title: 'No file selected', description: 'Please select an Excel file to import.' });
            return;
        }
        setIsProcessing(true);
        // In a real implementation, you would:
        // 1. Upload the file to a server action.
        // 2. Parse the Excel file on the server.
        // 3. Let the user map columns.
        // 4. Process and save the data.
        
        // For this placeholder, we'll just simulate a delay.
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast({ title: 'Import Complete!', description: `${file.name} has been processed.` });
        setIsProcessing(false);
        onSuccess();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Import Products from Excel</DialogTitle>
                    <DialogDescription>
                        Upload an .xlsx or .csv file to bulk-add or update products.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="excel-file">Excel File</Label>
                        <div className="relative">
                            <Input
                                id="excel-file"
                                type="file"
                                onChange={handleFileChange}
                                accept=".xlsx, .csv"
                                className="pl-12"
                            />
                             <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                     {file && (
                        <div className="flex items-center p-2 rounded-md bg-muted border">
                            <File className="h-5 w-5 mr-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{file.name}</span>
                        </div>
                    )}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Column Mapping</AlertTitle>
                        <AlertDescription>
                            This is a placeholder. A full implementation would allow you to map columns from your Excel file (e.g., 'Product Title', 'Stock Amount') to the database fields (e.g., 'name', 'stock').
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!file || isProcessing}>
                        {isProcessing ? 'Importing...' : 'Start Import'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
