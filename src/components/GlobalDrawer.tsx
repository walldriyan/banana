// src/components/GlobalDrawer.tsx
'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useDrawer } from '@/hooks/use-drawer';

export function GlobalDrawer() {
  const { isOpen, closeDrawer, content, title, description } = useDrawer();

  // We use onOpenChange to sync the state of the sheet with our context
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDrawer();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-4">{content}</div>
      </SheetContent>
    </Sheet>
  );
}
