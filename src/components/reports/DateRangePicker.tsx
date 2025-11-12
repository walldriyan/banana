// src/components/reports/DateRangePicker.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "../ui/label"

interface DateRangePickerProps {
    dateRange: DateRange | undefined;
    setDateRange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ dateRange, setDateRange }: DateRangePickerProps) {

  const handleFromDateSelect = (day: Date | undefined) => {
    setDateRange({ from: day, to: dateRange?.to });
  };
  
  const handleToDateSelect = (day: Date | undefined) => {
    setDateRange({ from: dateRange?.from, to: day });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="date-from">From</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-from"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange?.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? format(dateRange.from, "LLL dd, y") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange?.from}
              onSelect={handleFromDateSelect}
              disabled={{ after: dateRange?.to }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col space-y-2">
        <Label htmlFor="date-to">To</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-to"
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange?.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.to ? format(dateRange.to, "LLL dd, y") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange?.to}
              onSelect={handleToDateSelect}
              disabled={{ before: dateRange?.from }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
