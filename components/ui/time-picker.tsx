"use client"

import * as React from "react"
import { CiClock2 } from "react-icons/ci"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TimePickerProps {
  value?: string // Format: "HH:mm"
  onChange?: (time: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  const [selectedHour, selectedMinute] = value ? value.split(':') : ['09', '00']

  const handleHourSelect = (hour: string) => {
    onChange?.(`${hour}:${selectedMinute}`)
  }

  const handleMinuteSelect = (minute: string) => {
    onChange?.(`${selectedHour}:${minute}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CiClock2 className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <ScrollArea className="h-60 w-20 border-r">
            <div className="p-2">
              {hours.map((hour) => (
                <Button
                  key={hour}
                  variant={selectedHour === hour ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-center text-sm h-8 mb-1",
                    selectedHour === hour && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleHourSelect(hour)}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea className="h-60 w-20">
            <div className="p-2">
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  variant={selectedMinute === minute ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-center text-sm h-8 mb-1",
                    selectedMinute === minute && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleMinuteSelect(minute)}
                >
                  {minute}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
