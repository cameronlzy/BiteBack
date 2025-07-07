import UserReservation from "@/components/reservations/UserReservations"
import authService from "@/services/authService"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useLocation, useNavigate } from "react-router-dom"
import CustomerReviews from "./reviews/CustomerReviews"
import DeleteAccountPopup from "./authorisation/DeleteAccountPopup"
import { useState } from "react"
import ViewStaffAccounts from "./staff/ViewStaffAccounts"
import CustomerPoints from "./rewards/CustomerPoints"
const ProfilePage = ({ user, isLoading }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const handleLogout = async () => {
    await authService.logout()
    window.location = "/"
  }

  const dropdownContent = [
    {
      content: "Change Password",
      onClick: () => {
        navigate("/change-password", {
          replace: true,
          state: {
            from: location.pathname,
          },
        })
      },
    },
    {
      content: "Edit Profile",
      onClick: () =>
        navigate("/me/edit", { state: { from: location.pathname } }),
    },
    { content: "Logout", onClick: handleLogout },
    {
      content: "Delete Account",
      onClick: () => setShowDeletePopup(true),
    },
    ...(user?.role === "owner"
      ? [
          {
            content: "Add Restaurant",
            onClick: () =>
              navigate("/restaurants/new", {
                state: { from: location.pathname },
              }),
          },
        ]
      : []),
  ]
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative mb-6">
        <div className="absolute top-0 right-0 flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownContent.map(({ onClick, content }) => (
                <DropdownMenuItem key={content} onClick={onClick}>
                  {content}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {showDeletePopup && (
          <DeleteAccountPopup
            onClose={() => setShowDeletePopup(false)}
            role={user.role}
            isLoading={isLoading}
          />
        )}
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

      <UserReservation user={user} />
      {user.role === "customer" && (
        <div className="w-full">
          <CustomerReviews viewedCustomer={user} user={user} />
          <CustomerPoints />
        </div>
      )}
      {user.role === "owner" && (
        <div className="w-full flex flex-col gap-6 items-center">
          <ViewStaffAccounts />
        </div>
      )}
    </div>
  )
}

export default ProfilePage
