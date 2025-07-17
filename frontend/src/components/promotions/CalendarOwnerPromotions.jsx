import React, { useEffect, useState } from "react"
import Calendar from "@/components/common/Calendar"
import CustomDay from "@/components/common/CustomDay"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { getOwnerPromotions } from "@/services/promotionService"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"

const CalendarOwnerPromotions = ({ user }) => {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showUpcoming, setShowUpcoming] = useState(true)

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true)
      try {
        const res = await getOwnerPromotions({
          page: 1,
          limit: 20,
          status: showUpcoming ? "upcoming" : "past",
        })
        setPromotions(res.promotions || [])
      } catch (ex) {
        toast.error("Failed to load promotions")
        throw ex
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [user._id, showUpcoming])

  if (loading) return <LoadingSpinner size="md" />

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Your Promotions (Calendar View)
      </h2>

      <div className="flex justify-center gap-4 mb-4">
        <Button
          variant={showUpcoming ? "default" : "outline"}
          onClick={() => setShowUpcoming(true)}
        >
          Current
        </Button>
        <Button
          variant={!showUpcoming ? "default" : "outline"}
          onClick={() => setShowUpcoming(false)}
        >
          Past
        </Button>
      </div>

      {promotions.length === 0 ? (
        <p className="text-gray-500 text-center">
          No {showUpcoming ? "upcoming" : "past"} promotions
        </p>
      ) : (
        <>
          <div className="flex justify-center">
            <Calendar
              selected={selectedDate}
              onSelect={setSelectedDate}
              components={{
                Day: (props) => (
                  <CustomDay
                    {...props}
                    existingItems={promotions}
                    updateDate={setSelectedDate}
                    type="Promotion"
                  />
                ),
              }}
              disabled={() => false}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Displaying up to 20 {showUpcoming ? "ongoing" : "past"} scheduled
            promotions
          </p>
        </>
      )}
    </div>
  )
}

export default CalendarOwnerPromotions
