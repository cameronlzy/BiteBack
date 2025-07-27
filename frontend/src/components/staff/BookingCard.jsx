import { Button } from "../ui/button"
import { badgeVariants } from "../ui/badge"
import { cn } from "@/lib/utils"

const statusColours = {
  booked: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  "no-show": "bg-red-100 text-red-800",
}

const BookingCard = ({ booking: b, onStatusUpdate, eventTitle }) => {
  return (
    <div className="border rounded-md p-4 mb-3 flex justify-between items-start">
      <div className="flex flex-col text-left space-y-1">
        {eventTitle && (
          <p className="font-semibold text-sm text-muted-foreground">
            Event: {eventTitle}
          </p>
        )}
        {b.status === "event" ? (
          <p className="font-semibold">Booked By Owner</p>
        ) : (
          <>
            <p className="font-semibold">Name: {b.customer?.name}</p>
            <p className="font-semibold">Number: {b.customer?.contactNumber}</p>
          </>
        )}
        <p className="text-sm text-muted-foreground">
          Number of Guests: {b.pax}
        </p>
        <span
          className={cn(
            badgeVariants({ variant: "outline" }),
            "rounded-full px-3 w-fit",
            statusColours[b.status] || "bg-muted text-muted-foreground"
          )}
        >
          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
        </span>
        <p className="text-sm text-muted-foreground">
          Remarks: {b.remarks || "No remarks provided"}
        </p>
      </div>

      <div className="flex flex-col gap-2 items-center">
        {b.status === "booked" && (
          <div>
            <Button
              size="sm"
              className="mr-2"
              onClick={() => onStatusUpdate(b._id, "completed")}
            >
              Mark Completed
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingCard
