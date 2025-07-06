import React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, CalendarDays, LogOut, Gift } from "lucide-react"
import authService from "@/services/authService"
import StaffQueue from "./StaffQueue"
import StaffBookings from "./StaffBookings"
import StaffPointUpdate from "./StaffPointUpdate"
import StaffRewardCompletion from "./StaffRewardCompletion"

const StaffControlCenter = ({ user }) => {
  const handleLogout = async () => {
    await authService.logout()
    window.location = "/"
  }

  return (
    <div className="w-full mt-6 flex flex-col items-center">
      <div className="w-full max-w-6xl flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Control Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Central Area for Queues, Bookings, Rewards and Points
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="queue" className="w-full max-w-6xl">
        <TabsList className="grid w-full grid-cols-3 mb-6 text-xs md:text-sm">
          <TabsTrigger
            value="queue"
            className="flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-5 h-5" />
            <span className="hidden md:inline">Queue</span>
          </TabsTrigger>
          <TabsTrigger
            value="rewards"
            className="flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            <span className="hidden md:inline">Rewards & Points</span>
          </TabsTrigger>
          <TabsTrigger
            value="bookings"
            className="flex items-center justify-center gap-2"
          >
            <CalendarDays className="w-5 h-5" />
            <span className="hidden md:inline">Bookings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <StaffQueue user={user} />
        </TabsContent>

        <TabsContent value="rewards">
          <StaffPointUpdate />
          <StaffRewardCompletion />
        </TabsContent>

        <TabsContent value="bookings">
          <StaffBookings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default StaffControlCenter
