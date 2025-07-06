import { useEffect, useState } from "react"
import { getRedemptionHistory } from "@/services/rewardService"
import { toast } from "react-toastify"
import TransactionCard from "@/components/common/TransactionCard"
import { iconMap } from "@/utils/rewardUtils"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import Pagination from "@/components/common/Pagination"

const CustomerPastRewards = () => {
  const [rewards, setRewards] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const params = { page, limit: 8, status: "completed,expired" }
        const data = await getRedemptionHistory(params)
        setRewards(data.redemptions)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      } catch (ex) {
        console.error("Failed to fetch rewards", ex)
        toast.error("Failed to fetch rewards")
      }
    }

    fetchRewards()
  }, [page])

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      {rewards.length === 0 ? (
        <p className="text-gray-500">No Rewards Found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rewards.map((reward) => {
            const snapshot = reward.rewardItemSnapshot || {}
            const { icon: Icon, colour } = iconMap[snapshot.category] || {}

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
                description={getCardMessageFromDescription(
                  snapshot.description
                )}
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

export default CustomerPastRewards
