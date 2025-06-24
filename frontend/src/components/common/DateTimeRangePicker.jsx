import React from "react"
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Controller } from "react-hook-form"

const DateTimeRangePicker = ({ control, name, label = "Schedule" }) => {
  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>

      <div className="flex flex-col md:flex-row gap-4">
        <Controller
          control={control}
          name={`${name}.start`}
          render={({ field, fieldState }) => (
            <FormItem className="w-full">
              <FormLabel>Start</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <Controller
          control={control}
          name={`${name}.end`}
          render={({ field, fieldState }) => (
            <FormItem className="w-full">
              <FormLabel>End</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage>{fieldState.error?.message}</FormMessage>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

export default DateTimeRangePicker
