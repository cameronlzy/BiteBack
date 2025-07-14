import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import OwnerEvents from "./events-booking/OwnerEvents"
import OwnerPromotions from "./promotions/OwnerPromotions"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { CalendarDays, Tag } from "lucide-react"

const OwnerEventsAndPromos = ({ user }) => {
  const navigate = useNavigate()

  useEffect(() => {
    if (user.role !== "owner") {
      navigate("/not-found", { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center">
        Manage Events & Promotions
      </h2>
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-6 w-full flex justify-center gap-4">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <OwnerEvents user={user} />
        </TabsContent>

        <TabsContent value="promotions">
          <OwnerPromotions user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OwnerEventsAndPromos
