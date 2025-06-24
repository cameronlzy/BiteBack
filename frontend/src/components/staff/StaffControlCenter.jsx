import React from "react"
import authService from "@/services/authService"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import StaffQueue from "./StaffQueue"
import StaffBookings from "./StaffBookings"

const StaffControlCenter = ({ user }) => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout()
    navigate("/")
  }
  return (
    <React.Fragment>
      <div className="mt-6">
        <h1 className="text-3xl font-bold">Staff Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Central Area for Queues and Reservation management
        </p>
      </div>
      <div className="flex justify-end mb-4">
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <StaffQueue user={user} />
      <StaffBookings />
    </React.Fragment>
  )
}

export default StaffControlCenter
