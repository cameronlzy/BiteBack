import { useEffect, useState } from "react"
import { getRedemptionHistory } from "@/services/rewardService"
import { toast } from "react-toastify"
import TransactionCard from "@/components/common/TransactionCard"
import { iconMap } from "@/utils/rewardUtils"
import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import Pagination from "@/components/common/Pagination"
import LoadingSpinner from "../common/LoadingSpinner"
import { useSearchParams } from "react-router-dom"

const CustomerPastRewards = () => {
  const [rewards, setRewards] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page")) || 1
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true)
      try {
        const params = { page, limit: 8, status: "completed,expired" }
        const data = await getRedemptionHistory(params)
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
        onPageChange={(p) => setSearchParams({ page: p })}
      />
    </div>
  )
}

export default CustomerPastRewards
