import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import CustomerPastRewards from "./CustomerPastRewards"
import CustomerCurrentRewards from "./CustomerCurrentRewards"
import { Button } from "@/components/ui/button"

const CustomerRewards = ({ user }) => {
  const [showPast, setShowPast] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user.role !== "customer") {
      toast.error("Only customers can access this page", {
        toastId: "reward-access",
      })
      navigate("/restaurants", { replace: true })
    }
  }, [user._id])

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {showPast ? "Your Past Rewards" : "Your Current Rewards"}
        </h2>
        <Button variant="outline" onClick={() => setShowPast((prev) => !prev)}>
          {showPast ? "Show Current" : "Show Past"}
        </Button>
      </div>
      {showPast ? <CustomerPastRewards /> : <CustomerCurrentRewards />}
    </div>
  )
}

export default CustomerRewards
