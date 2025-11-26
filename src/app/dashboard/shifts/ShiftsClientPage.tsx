// src/app/dashboard/shifts/ShiftsClientPage.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Shift } from '@prisma/client';
import { getShiftsAction, getActiveShiftAction, type ShiftWithCalculations } from '@/lib/actions/shift.actions';
import { ShiftsDataTable } from './data-table';
import { getColumns } from './columns';
import { useToast } from '@/hooks/use-toast';
import { useDrawer } from '@/hooks/use-drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { StartShiftForm } from '@/components/shifts/StartShiftForm';
import { EndShiftForm } from '@/components/shifts/EndShiftForm';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/store/session-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, PlayCircle, StopCircle } from 'lucide-react';
import { format } from 'date-fns';

export function ShiftsClientPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<ShiftWithCalculations | null>(null);
  const { toast } = useToast();
  const drawer = useDrawer();
  const user = useSessionStore(state => state.user);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [shiftsResult, activeShiftResult] = await Promise.all([
        getShiftsAction(),
        user ? getActiveShiftAction(user.id) : Promise.resolve({ success: true, data: null })
    ]);

    if (shiftsResult.success && shiftsResult.data) {
      setShifts(shiftsResult.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error fetching shifts',
        description: shiftsResult.error,
      });
    }

    if (activeShiftResult.success) {
        setActiveShift(activeShiftResult.data || null);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error fetching active shift',
            description: activeShiftResult.error,
        });
    }

    setIsLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSuccess = () => {
    drawer.closeDrawer();
    fetchData();
  };

  const openStartShiftDrawer = () => {
    if (!user) return;
    drawer.openDrawer({
      title: 'Start New Shift',
      description: `Starting a new shift for ${user.name}.`,
      content: <StartShiftForm userId={user.id} userName={user.name} onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-md'
    });
  };

  const openEndShiftDrawer = () => {
    if (!activeShift) return;
    drawer.openDrawer({
      title: 'End Current Shift',
      description: 'Review and confirm the closing balance.',
      content: <EndShiftForm shift={activeShift} onSuccess={handleFormSuccess} />,
      drawerClassName: 'sm:max-w-md'
    });
  };
  
  const columns = useMemo(() => getColumns(), []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
    <Card className="mb-6">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Your Shift Status
            </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between">
            {activeShift ? (
                <div>
                    <p className="text-muted-foreground">You have an active shift that started on:</p>
                    <p className="text-lg font-semibold">{format(new Date(activeShift.startTime), "PPp")}</p>
                </div>
            ) : (
                <p className="text-lg text-muted-foreground">You do not have an active shift.</p>
            )}
            <div className="mt-4 sm:mt-0">
                {activeShift ? (
                    <Button onClick={openEndShiftDrawer} variant="destructive">
                        <StopCircle className="mr-2 h-4 w-4" /> End Shift
                    </Button>
                ) : (
                    <Button onClick={openStartShiftDrawer} className="bg-green-600 hover:bg-green-700">
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Shift
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
      <ShiftsDataTable
        columns={columns}
        data={shifts}
      />
    </>
  );
}
