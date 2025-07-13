import { useState } from "react"
import { Button } from "@/components/ui/button"
import ListOwnerPromotions from "./ListOwnerPromotions"
import CalendarOwnerPromotions from "./CalendarOwnerPromotions"

const OwnerPromotions = ({ user }) => {
  const [viewMode, setViewMode] = useState("list")

  const toggleView = () => {
    setViewMode((prev) => (prev === "list" ? "calendar" : "list"))
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="flex flex-col items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold text-center">Your Promotions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleView}
          className="text-sm px-3 py-1"
        >
          Switch to {viewMode === "list" ? "Calendar" : "List"} View
        </Button>
      </div>

      {viewMode === "list" ? (
        <ListOwnerPromotions user={user} />
      ) : (
        <CalendarOwnerPromotions user={user} />
      )}
    </div>
  )
}

export default OwnerPromotions
