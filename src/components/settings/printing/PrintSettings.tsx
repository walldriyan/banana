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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RotateCcw, Save } from 'lucide-react';
import defaultEn from '@/lib/locales/en.json';
import defaultSi from '@/lib/locales/si.json';

type LocaleData = Record<string, string>;

export function PrintSettings() {
  const [initialData, setInitialData] = useState<{ en: LocaleData; si: LocaleData } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const methods = useForm<{ en: LocaleData; si: LocaleData }>();
  const { handleSubmit, reset, formState: { isSubmitting, isDirty } } = methods;

  const fetchLocales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getLocaleDataAction();
    if (result.success && result.data) {
      setInitialData(result.data);
      reset(result.data); // Set form values
    } else {
      setError(result.error || 'Failed to load locale data.');
    }
    setIsLoading(false);
  }, [reset]);

  useEffect(() => {
    fetchLocales();
  }, [fetchLocales]);

  const handleReset = () => {
    reset({ en: defaultEn, si: defaultSi });
    toast({ title: 'Fields Reset', description: 'Translation fields have been reset to their default values. Click Save to apply.' });
  };
  
  const onSubmit = async (data: { en: LocaleData; si: LocaleData }) => {
    const result = await updateLocaleDataAction(data.en, data.si);
    if (result.success) {
      toast({ title: 'Success!', description: 'Translation files have been updated.' });
      // Refetch data to reset dirty state
      await fetchLocales();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
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
  
  const translationKeys = Object.keys(initialData.en);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Receipt Translation Editor</CardTitle>
            <CardDescription>
              Edit the text displayed on the printed thermal receipt for each language.
              Your changes will be saved directly to the project's translation files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {translationKeys.map((key) => (
              <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-3 border rounded-md">
                <p className="md:col-span-2 text-sm font-semibold text-muted-foreground">{key}</p>
                <FormField
                  control={methods.control}
                  name={`en.${key}`}
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
                  name={`si.${key}`}
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
          <CardFooter className="flex justify-end gap-2 border-t pt-6">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={isSubmitting}>
              <RotateCcw className="mr-2 h-4 w-4"/>
              Reset to Default
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              <Save className="mr-2 h-4 w-4"/>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
