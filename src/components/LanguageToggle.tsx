// src/components/LanguageToggle.tsx
'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const isSinhala = language === 'si';

  const handleToggle = (checked: boolean) => {
    setLanguage(checked ? 'si' : 'en');
  };

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="language-toggle" className={!isSinhala ? 'font-bold text-primary' : 'text-muted-foreground'}>
        EN
      </Label>
      <Switch
        id="language-toggle"
        checked={isSinhala}
        onCheckedChange={handleToggle}
        aria-label="Language Toggle"
      />
      <Label htmlFor="language-toggle" className={isSinhala ? 'font-bold text-primary' : 'text-muted-foreground'}>
        සිං
      </Label>
    </div>
  );
}
