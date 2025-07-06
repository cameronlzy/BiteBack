import { useEffect, useState } from "react"
import {
  activateRedemption,
  getRedemptionHistory,
} from "@/services/rewardService"
import { toast } from "react-toastify"
import TransactionCard from "@/components/common/TransactionCard"
import { iconMap } from "@/utils/rewardUtils"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import Pagination from "@/components/common/Pagination"
import { DateTime } from "luxon"
import LoadingSpinner from "../common/LoadingSpinner"

const CustomerCurrentRewards = () => {
  const [rewards, setRewards] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true)
      try {
        const params = { page, limit: 8, status: "activated,active" }
        const data = await getRedemptionHistory(params)
        console.log(data)
        data.redemptions = data.redemptions.sort((r1, r2) => {
          return (r2.status === "activated") - (r1.status === "activated")
        })
        setRewards(data.redemptions)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      } catch (ex) {
        console.error("Failed to fetch rewards", ex)
        toast.error("Failed to fetch rewards")
      } finally {
        setLoading(false)
      }
    }

    fetchRewards()
  }, [page])

  const handleActivate = async (id) => {
    try {
      const updatedReward = await activateRedemption(id)
      toast.success("Reward activated")

      setRewards((prevRewards) =>
        prevRewards.map((r) => (r._id === id ? updatedReward : r))
      )
    } catch (ex) {
      console.error("Failed to activate reward", ex)
      toast.error("Failed to activate reward")
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      {rewards.length === 0 ? (
        <p className="text-gray-500">No Rewards Found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rewards.map((reward) => {
            const snapshot = reward.rewardItemSnapshot || {}
            const { icon: Icon, colour } = iconMap[snapshot.category] || {}
            const isActivated = reward.status === "activated"
            const activatedAt = reward.activatedAt
            const expiry = activatedAt
              ? DateTime.fromISO(activatedAt).plus({ minutes: 15 })
              : null

            return (
              <TransactionCard
                key={reward._id}
                _id={reward._id}
                name={snapshot.title || "Reward"}
                price={snapshot.pointsRequired}
                currencyType="points"
                iconComponent={
                  Icon ? <Icon className={`w-20 h-20 ${colour}`} /> : null
                }
                rewardCode={isActivated ? reward.code : null}
                description={
                  !isActivated
                    ? getCardMessageFromDescription(snapshot.description)
                    : null
                }
                startTime={isActivated ? activatedAt : null}
                timeDuration={isActivated ? 15 : null}
                expiry={isActivated ? expiry : null}
                withinStartMessage={isActivated ? "Reward expires in" : null}
                {...(!isActivated && {
                  clickMessage: "Claim Reward",
                  onClick: () => handleActivate(reward._id),
                })}
              />
            )
          })}
        </div>
      )}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  )
}

export default CustomerCurrentRewards
