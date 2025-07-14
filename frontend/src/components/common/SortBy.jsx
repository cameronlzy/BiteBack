import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react"

const SortBy = ({
  options,
  items,
  onSorted,
  backendHandle = false,
  selectedValue = null,
  selectedDirection = null,
}) => {
  const [open, setOpen] = useState(false)

  const handleSort = (value, direction) => {
    setOpen(false)

    if (backendHandle) {
      onSorted({ value, direction })
    } else {
      const sorted = [...items].sort((a, b) => {
        const aVal = a[value]?.toString().toLowerCase()
        const bVal = b[value]?.toString().toLowerCase()

        if (aVal < bVal) return direction === "asc" ? -1 : 1
        if (aVal > bVal) return direction === "asc" ? 1 : -1
        return 0
      })
      onSorted(sorted)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-full mb-2">
          Sort By <ChevronDown className="ml-2 w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[200px] space-y-2">
        {options.map(({ label, value }) => (
          <div key={value} className="flex justify-between items-center">
            <span className="text-sm">{label}</span>
            <div className="space-x-1">
              <Button
                variant={
                  selectedValue === value && selectedDirection === "asc"
                    ? "secondary"
                    : "ghost"
                }
                size="icon"
                onClick={() => handleSort(value, "asc")}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <Button
                variant={
                  selectedValue === value && selectedDirection === "desc"
                    ? "secondary"
                    : "ghost"
                }
                size="icon"
                onClick={() => handleSort(value, "desc")}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export default SortBy
