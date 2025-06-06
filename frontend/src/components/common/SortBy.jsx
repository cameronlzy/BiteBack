import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react"

const SortBy = ({ options, items, onSorted }) => {
  const [selectedSort, setSelectedSort] = useState({
    value: null,
    direction: null,
  })
  const [open, setOpen] = useState(false)

  const handleSort = (value, direction) => {
    const sorted = [...items].sort((a, b) => {
      const aVal = a[value]?.toString().toLowerCase()
      const bVal = b[value]?.toString().toLowerCase()

      if (aVal < bVal) return direction === "asc" ? -1 : 1
      if (aVal > bVal) return direction === "asc" ? 1 : -1
      return 0
    })

    setSelectedSort({ value, direction })
    onSorted(sorted)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-full">
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
                  selectedSort.value === value &&
                  selectedSort.direction === "asc"
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
                  selectedSort.value === value &&
                  selectedSort.direction === "desc"
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
