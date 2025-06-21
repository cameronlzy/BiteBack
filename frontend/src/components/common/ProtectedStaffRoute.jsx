import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"

const ProtectedStaffRoute = ({ element, user, loading }) => {
  const location = useLocation()

  useEffect(() => {
    if (!loading && (!user || user.role !== "staff")) {
      toast.info("Please login with a staff account", {
        toastId: "staff-auth-redirect",
      })
    }
  }, [user, loading])

  if (!user) {
    return (
      <Navigate to="/staff/login" state={{ from: location.pathname }} replace />
    )
  }
  if (user.role !== "staff") {
    return <Navigate to="/" state={{ from: location.pathname }} replace />
  }

  return element
}

export default ProtectedStaffRoute
