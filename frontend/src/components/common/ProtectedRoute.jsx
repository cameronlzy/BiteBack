import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { toast } from "react-toastify"

const ProtectedRoute = ({ element, user, loading }) => {
  const location = useLocation()

  useEffect(() => {
    if (!user & !loading) {
      toast.info("Please Log in First", { toastId: "auth-redirect" })
    }
  }, [user])

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return element
}

export default ProtectedRoute
