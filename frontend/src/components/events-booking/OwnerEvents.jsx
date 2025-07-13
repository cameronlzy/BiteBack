import { useState } from "react"
import { Button } from "@/components/ui/button"
import ListOwnerEvents from "./ListOwnerEvents"
import CalendarOwnerEvents from "./CalendarOwnerEvents"

const OwnerEvents = ({ user }) => {
  const [viewMode, setViewMode] = useState("list")

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h2 className="text-2xl font-bold text-center">Your Events</h2>
        <Button
          className="text-sm px-3 py-1"
          variant="outline"
          onClick={() =>
            setViewMode((prev) => (prev === "list" ? "calendar" : "list"))
          }
        >
          Switch to {viewMode === "list" ? "Calendar" : "List"} View
        </Button>
      </div>

      {viewMode === "list" ? (
        <ListOwnerEvents user={user} />
      ) : (
        <CalendarOwnerEvents user={user} />
      )}
    </div>
  )
}

export default OwnerEvents
