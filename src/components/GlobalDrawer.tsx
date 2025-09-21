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
import { cn } from '@/lib/utils';

export function GlobalDrawer() {
  const { isOpen, closeDrawer, content, title, description, closeOnOverlayClick, drawerClassName, headerActions } = useDrawer();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeDrawer();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent 
        className={cn("w-full sm:max-w-2xl overflow-y-auto", drawerClassName)} // Combine default and custom classes
        onInteractOutside={(e) => {
            if (!closeOnOverlayClick) {
                e.preventDefault();
            }
        }}
      >
        <SheetHeader>
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
          {headerActions && <div className="pt-4">{headerActions}</div>}
        </SheetHeader>
        <div className="mt-4">{content}</div>
      </SheetContent>
    </Sheet>
  );
}
