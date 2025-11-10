// src/components/GlobalDrawer.tsx
'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { useDrawer } from '@/hooks/use-drawer';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';


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
        className={cn("w-full sm:max-w-2xl flex flex-col", drawerClassName)}
        onInteractOutside={(e) => {
            if (!closeOnOverlayClick) {
                e.preventDefault();
            }
        }}
      >
        <SheetHeader className="flex-shrink-0 pr-6">
          {title && <SheetTitle>{title}</SheetTitle>}
          {description && <SheetDescription>{description}</SheetDescription>}
          {headerActions && <div className="pt-4">{headerActions}</div>}
        </SheetHeader>
        <div className="flex-grow overflow-y-auto -mr-6 pr-6">
            {content}
        </div>
        <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
