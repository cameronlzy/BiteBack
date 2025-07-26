import { readableTimeSettings } from "@/utils/timeConverter"
import { DateTime } from "luxon"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CustomerReviews from "./reviews/CustomerReviews"
import { getGeneralCustomerInfo } from "@/services/userService"
import LoadingSpinner from "./common/LoadingSpinner"
import { Award, Star } from "lucide-react"
import { badges } from "@/utils/badges"

const GeneralProfilePage = ({ user }) => {
  // user details will be for following in the future
  const { custId } = useParams()
  const [viewedCustomer, setViewedCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customer = await getGeneralCustomerInfo(custId)
        const viewedCustomer = {
          ...customer,
          profile: {
            _id: custId,
          },
        }
        setViewedCustomer(viewedCustomer)
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
  if (loading) return <LoadingSpinner />
  return (
    <div className="container mx-auto p-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
          {viewedCustomer.username}
        </h1>
        <p className="text-muted-foreground italic font-medium">
          Since{" "}
          {DateTime.fromISO(viewedCustomer.dateJoined).toLocaleString({
            ...readableTimeSettings,
            hour: undefined,
            minute: undefined,
          })}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row sm:justify-center sm:items-center gap-6 text-base text-gray-800 font-medium">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-lg font-semibold">
              {viewedCustomer?.reviewCount || 0} review
              {viewedCustomer?.reviewCount !== 1 && "s"}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold flex items-center gap-1 mb-4 justify-center text-gray-800">
            <Award className="w-5 h-5 text-purple-500" />
            Badges Received
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md mx-auto">
            {badges.map((badge, index) => (
              <div key={badge.name} className="flex flex-col items-center">
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-12 h-12 mb-1"
                />
                <span className="text-sm font-semibold text-gray-800">
                  {badge.label}
                </span>
                <span className="text-sm text-gray-600">
                  {(viewedCustomer.badgeCounts?.[index] ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Badges Count when implementing those will go here */}
      <CustomerReviews viewedCustomer={viewedCustomer} user={user} />
    </div>
  )
}

export default GeneralProfilePage
