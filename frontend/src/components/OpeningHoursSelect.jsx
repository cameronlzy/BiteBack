import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const OpeningHoursSelect = ({ index, control, trigger }) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {daysOfWeek.map((day) => (
        <FormField
          key={day}
          control={control}
          name={`restaurants.${index}.openingHours.${day}`}
          render={({ field }) => {
            const isClosed = field.value === "Closed"

            return (
              <FormItem>
                <FormLabel>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </FormLabel>

                <FormControl>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`closed-${day}-${index}`}
                        checked={isClosed}
                        onCheckedChange={(checked) => {
                          const val = checked ? "Closed" : ""
                          field.onChange(val)
                          trigger(`restaurants.${index}.openingHours.${day}`)
                        }}
                      />
                      <label
                        htmlFor={`closed-${day}-${index}`}
                        className="text-sm font-medium leading-none"
                      >
                        Closed
                      </label>
                    </div>

                    {!isClosed && (
                      <Input
                        type="text"
                        value={field.value}
                        placeholder="Enter hours e.g., 08:00-17:00"
                        onChange={(e) => {
                          field.onChange(e.target.value)
                          trigger(`restaurants.${index}.openingHours.${day}`)
                        }}
                        className="w-[240px]"
                      />
                    )}
                  </div>
                </FormControl>

                <FormMessage />
              </FormItem>
            )
          }}
        />
      ))}
    </div>
  )
}

export default OpeningHoursSelect
