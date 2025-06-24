import React from "react"
import StaffQueue from "./StaffQueue"
import StaffBookings from "./StaffBookings"

const StaffControlCenter = ({ user }) => {
  return (
    <React.Fragment>
      <div className="mt-6">
        <h1 className="text-3xl font-bold">Staff Control Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Central Area for Queues and Reservation management
        </p>
      </div>
      <StaffQueue user={user} />
      <StaffBookings />
    </React.Fragment>
  )
}

export default StaffControlCenter
