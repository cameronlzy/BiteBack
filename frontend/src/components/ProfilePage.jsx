import React from "react"
import CustomerReservations from "@/components/CustomerReservations"
import OwnerRestaurants from "@/components/OwnerRestaurants"
import authService from "@/services/authService"
import { Button } from "@/components/ui/button"
import { useLocation, useNavigate } from "react-router-dom"
import CustomerReviews from "./CustomerReviews"
const ProfilePage = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogout = async () => {
    await authService.logout()
    window.location = "/"
  }
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative mb-6">
        {/* Button Group: Top-right on md+, stacked below on mobile */}
        <div className="absolute top-0 right-0 hidden sm:flex gap-2">
          <Button
            onClick={() =>
              navigate("/me/edit", { state: { from: location.pathname } })
            }
            variant="ghost"
          >
            Edit Profile
          </Button>
          <Button onClick={handleLogout} variant="ghost">
            Logout
          </Button>
        </div>

        {/* Mobile Button Group (shown only on small screens) */}
        <div className="flex sm:hidden justify-center gap-2 mt-2">
          <Button
            onClick={() =>
              navigate("/me/edit", { state: { from: location.pathname } })
            }
            variant="ghost"
          >
            Edit
          </Button>
          <Button onClick={handleLogout} variant="ghost">
            Logout
          </Button>
        </div>

        {/* Centered Profile Info */}
        <div className="text-center mt-2">
          <h1 className="text-3xl font-bold">
            {user.role === "customer"
              ? user.profile.name
              : user.profile.companyName}
          </h1>
          {user.role === "customer" && (
            <p className="text-sm text-gray-500">
              Contact: {user.profile.contactNumber}
            </p>
          )}
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {user.role === "customer" && (
        <>
          <CustomerReservations user={user} />
          <CustomerReviews viewedCustomer={user} user={user} />
        </>
      )}
      {user.role === "owner" && (
        <>
          <OwnerRestaurants user={user} />
        </>
      )}
    </div>
  )
}

export default ProfilePage
