import { useEffect } from "react"
import LoadingSpinner from "../common/LoadingSpinner"
import { useNavigate, useParams } from "react-router-dom"
import { unsubscribeEmailThread } from "@/services/userService"
import { toast } from "react-toastify"

const UnsubscribeEmail = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  useEffect(() => {
    const unsubscribeEmail = async () => {
      try {
        await unsubscribeEmailThread(token)
        toast.success("Email Unsubscribed", { replace: true })
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Token Invalid", { toastId: "invalid-unsubscribe-token" })
        } else {
          toast.error("Promotion Email Unsubscription Failed", {
            toastId: "unsubscribe-fail",
          })
        }
        throw ex
      } finally {
        navigate("/promotions", { replace: true })
      }
    }

    if (token?.trim()) {
      unsubscribeEmail()
    }
  }, [token])
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-2">
      <div className="flex items-center">
        <LoadingSpinner />
        <span className="ml-2 text-sm text-gray-600">Unsubscribing...</span>
      </div>
      <p className="text-sm text-muted-foreground italic text-center">
        Customers can also unsubscribe through Edit Profile
      </p>
    </div>
  )
}

export default UnsubscribeEmail
