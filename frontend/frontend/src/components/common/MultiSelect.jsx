import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useState } from "react"

export function MultiSelect({
  id,
  options,
  selected,
  onChange,
  placeholder = "Select...",
}) {
  const [open, setOpen] = useState(false)

  const toggleOption = (value) => {
    const safeSelected = Array.isArray(selected) ? selected : []

    if (safeSelected.includes(value)) {
      onChange(safeSelected.filter((v) => v !== value))
    } else {
      onChange([...safeSelected, value])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          className="w-full justify-normal"
        >
          {Array.isArray(selected) && selected.length > 0 ? (
            selected.map((item) => <Badge key={item}>{item}</Badge>)
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search cuisine..." />
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option}
                onSelect={() => toggleOption(option)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-start w-full">
                  <span>{option}</span>
                  {selected.includes(option) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
