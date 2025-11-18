// src/components/settings/printing/PrintSettings.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { getLocaleDataAction, updateLocaleDataAction } from '@/lib/actions/locale.actions';
import { getCompanyForReceiptAction, updateCompanyReceiptDetailsAction } from '@/lib/actions/company.actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw, Save, Building } from 'lucide-react';
import defaultEn from '@/lib/locales/en.json';
import defaultSi from '@/lib/locales/si.json';
import type { Company } from '@prisma/client';

type LocaleData = Record<string, string>;

// Combined form values for both company details and locale strings
type PrintSettingsFormValues = {
  company: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  locales: {
    en: LocaleData;
    si: LocaleData;
  };
};

export function PrintSettings() {
  const [initialData, setInitialData] = useState<PrintSettingsFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const methods = useForm<PrintSettingsFormValues>();
  const { handleSubmit, reset, formState: { isSubmitting, isDirty } } = methods;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [localeResult, companyResult] = await Promise.all([
            getLocaleDataAction(),
            getCompanyForReceiptAction(),
        ]);

        if (!localeResult.success || !localeResult.data) {
            throw new Error(localeResult.error || 'Failed to load locale data.');
        }
        if (!companyResult.success || !companyResult.data) {
            throw new Error(companyResult.error || 'Failed to load company data.');
        }

        const fullData = {
            company: {
              id: companyResult.data.id,
              name: companyResult.data.name,
              address: companyResult.data.address || '',
              phone: companyResult.data.phone || '',
            },
            locales: localeResult.data,
        };

        setInitialData(fullData);
        reset(fullData); // Set form values
    } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    }
    setIsLoading(false);
  }, [reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReset = () => {
    if (initialData) {
        const resetData = {
          ...initialData,
          locales: {
            en: defaultEn,
            si: defaultSi,
          }
        };
        reset(resetData);
        toast({ title: 'Fields Reset', description: 'Translation fields have been reset to defaults. Save to apply.' });
    }
  };
  
  const onSubmit = async (data: PrintSettingsFormValues) => {
    const [companyUpdateResult, localeUpdateResult] = await Promise.all([
      updateCompanyReceiptDetailsAction(data.company.id, {
        name: data.company.name,
        address: data.company.address,
        phone: data.company.phone,
      }),
      updateLocaleDataAction(data.locales.en, data.locales.si)
    ]);


    if (companyUpdateResult.success && localeUpdateResult.success) {
      toast({ title: 'Success!', description: 'Receipt settings have been updated.' });
      await fetchData(); // Refetch data to reset dirty state
    } else {
      const errorMsg = companyUpdateResult.error || localeUpdateResult.error || 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: errorMsg });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !initialData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const translationKeys = Object.keys(initialData.locales.en).filter(key => !['shopName', 'shopAddress', 'shopTel'].includes(key));

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className='flex items-center gap-3'>
                        <Building className="h-6 w-6 text-muted-foreground" />
                        <div>
                            <CardTitle>Company Details for Receipt</CardTitle>
                            <CardDescription>
                            This information will appear at the top of the printed receipt.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={methods.control} name="company.name" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><Input {...field} /></FormItem> )} />
                     <FormField control={methods.control} name="company.address" render={({ field }) => ( <FormItem><FormLabel>Company Address</FormLabel><Input {...field} /></FormItem> )} />
                     <FormField control={methods.control} name="company.phone" render={({ field }) => ( <FormItem><FormLabel>Company Phone</FormLabel><Input {...field} /></FormItem> )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Receipt Label Translations</CardTitle>
                    <CardDescription>
                    Edit the text for each label on the receipt for different languages.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {translationKeys.map((key) => (
                    <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 border rounded-md">
                        <p className="md:col-span-2 text-sm font-semibold text-muted-foreground">{key}</p>
                        <FormField
                        control={methods.control}
                        name={`locales.en.${key}`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>English (en.json)</FormLabel>
                            <Input {...field} />
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={methods.control}
                        name={`locales.si.${key}`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sinhala (si.json)</FormLabel>
                            <Input {...field} />
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    ))}
                </CardContent>
            </Card>
        </div>
        <CardFooter className="flex justify-end gap-2 border-t pt-6 mt-6">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>
              <RotateCcw className="mr-2 h-4 w-4"/>
              Reset Translations
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              <Save className="mr-2 h-4 w-4"/>
              {isSubmitting ? 'Saving...' : 'Save All Changes'}
            </Button>
          </CardFooter>
      </form>
    </FormProvider>
  );
}
