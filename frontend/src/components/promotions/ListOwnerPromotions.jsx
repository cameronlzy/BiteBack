import { useEffect, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { getOwnerPromotions } from "@/services/promotionService"
import PromotionCard from "./PromotionCard"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import Pagination from "@/components/common/Pagination"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import NoResultsFound from "../common/NoResultsFound"

const ListOwnerPromotions = ({ user }) => {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const page = parseInt(searchParams.get("page")) || 1
  const limit = 8
  const showUpcoming = searchParams.get("current") !== "false"

  const fetchPromotions = async () => {
    setLoading(true)
    try {
      const response = await getOwnerPromotions({
        page,
        limit,
        status: showUpcoming ? "upcoming" : "past",
      })
      setPromotions(response.promotions || [])
      setTotalCount(response.totalCount || 0)
    } catch (ex) {
      toast.error("Failed to fetch owner promotions")
      console.error(ex)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
  }, [user._id, page, showUpcoming])

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage, current: showUpcoming })
  }

  const toggleCurrent = (isCurrent) => {
    setSearchParams({ page: 1, current: isCurrent })
  }

  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <Button
          variant={showUpcoming ? "default" : "outline"}
          onClick={() => toggleCurrent(true)}
        >
          Current
        </Button>
        <Button
          variant={!showUpcoming ? "default" : "outline"}
          onClick={() => toggleCurrent(false)}
        >
          Past
        </Button>
        <Button
          className="ml-auto"
          onClick={() =>
            navigate("/promotions/new", {
              state: {
                from: location.pathname,
              },
            })
          }
        >
          Add New Promotion
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : promotions.length === 0 ? (
        <NoResultsFound
          text={`No ${showUpcoming ? "current" : "past"} promotions.`}
        />
      ) : (
        <>
          <div className="space-y-4">
            {promotions.map((promo) => (
              <PromotionCard key={promo._id} {...promo} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

export default ListOwnerPromotions
