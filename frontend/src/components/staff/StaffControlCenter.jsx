import React from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, CalendarDays, Gift, Settings } from "lucide-react"
import authService from "@/services/authService"
import StaffQueue from "./StaffQueue"
import StaffBookings from "./StaffBookings"
import StaffPointUpdate from "./StaffPointUpdate"
import StaffRewardCompletion from "./StaffRewardCompletion"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const StaffControlCenter = ({ user }) => {
  const handleLogout = async () => {
    await authService.logout()
    window.location = "/"
  }

  const dropdownContent = [
    {
      content: "Logout",
      onClick: handleLogout,
    },
  ]

  return (
    <div className="w-full mt-6 flex flex-col items-center">
      <div className="w-full max-w-6xl mb-6 relative">
        <div className="absolute top-0 right-0 flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownContent.map(({ content, onClick }) => (
                <DropdownMenuItem key={content} onClick={onClick}>
                  {content}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="text-center mt-2">
          <h1 className="text-2xl font-bold">Staff Control Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Central Area for Queues, Bookings, Rewards and Points
          </p>
        </div>
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
