// src/components/settings/appearance/AppearanceSettings.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useThemeStore } from '@/store/theme-store';

export function AppearanceSettings() {
  const { font, setFont } = useThemeStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>
          Customize the application's theme and layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="font-selector">Application Font</Label>
            <Select value={font} onValueChange={(value: 'inter' | 'custom') => setFont(value)}>
                <SelectTrigger id="font-selector" className="w-[280px]">
                    <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="inter">Inter (Default)</SelectItem>
                    <SelectItem value="custom">Custom Font (Sinhala)</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                Changes the global font for the entire application.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
