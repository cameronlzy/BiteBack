import { readableTimeSettings } from "@/utils/timeConverter"
import { DateTime } from "luxon"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CustomerReviews from "./CustomerReviews"
import { getGeneralUserInfo } from "@/services/userService"

const GeneralProfilePage = ({ user }) => {
  // user details will be for following in the future
  const { custId } = useParams()
  const [viewedCustomer, setViewedCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customer = await getGeneralUserInfo(custId)
        setViewedCustomer(customer)
      } catch (ex) {
        if (ex.response && ex.response.status === 404) {
          navigate("/not-found", { replace: true })
          toast.error("Customer not found.", {
            toastId: "customer-not-found",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [custId])
  if (loading) return <div>Loading...</div>
  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{viewedCustomer.username}</h1>
        <p className="text-sm text-gray-500">
          Since{" "}
          {DateTime.fromISO(viewedCustomer.dateJoined).toLocaleString({
            ...readableTimeSettings,
            hour: undefined,
            minute: undefined,
          })}
        </p>
      </div>
      {/* Badges Count when implementing those will go here */}
      <CustomerReviews viewedCustomer={viewedCustomer} user={user} />
    </div>
  )
}

export default GeneralProfilePage
