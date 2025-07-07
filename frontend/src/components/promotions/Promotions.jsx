import { useEffect, useState } from "react"
import { getPromotions } from "@/services/promotionService"
import PromotionCard from "./PromotionCard"
import Pagination from "../common/Pagination"
import { toast } from "react-toastify"
import SearchBar from "../SearchBar"
import SortBy from "../common/SortBy"
import LoadingSpinner from "../common/LoadingSpinner"

const Promotions = ({ user }) => {
  const [promotions, setPromotions] = useState([])
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    sortBy: "startDate",
    order: "asc",
    search: null,
  })
  const [searchInput, setSearchInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [triggeredSearch, setTriggeredSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { promotions, totalPages, totalCount } = await getPromotions(
          params
        )
        setPromotions(promotions)
        setTotalPages(totalPages)
        setTotalCount(totalCount)
      } catch {
        toast.error("Failed to fetch promotions")
      } finally {
        setLoading(false)
        if (triggeredSearch) {
          setIsSubmitting(false)
          setTriggeredSearch(false)
        }
      }
    }
    fetchData()
  }, [params])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setParams((prev) => ({ ...prev, page: newPage }))
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTriggeredSearch(true)
    setParams((prev) => ({
      ...prev,
      search: searchInput.trim() === "" ? null : searchInput.trim(),
      page: 1,
    }))
  }

  const handleSort = ({ value, direction }) => {
    setParams((prev) => ({
      ...prev,
      sortBy: value,
      order: direction,
      page: 1,
    }))
  }

  const options = [
    { label: "Start Date", value: "startDate" },
    { label: "End Date", value: "endDate" },
    { label: "Title", value: "title" },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="w-full px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        Current Promotions
      </h2>

      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4 mb-6 px-4">
        <SearchBar
          name="Search"
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          isSubmitting={isSubmitting}
        />

        <SortBy
          options={options}
          items={promotions}
          backendHandle={true}
          onSorted={handleSort}
        />
      </div>

      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        {promotions.map((promo) => (
          <PromotionCard key={promo._id} {...promo} user={user} />
        ))}
      </div>

      <div className="mt-8">
        <Pagination
          currentPage={params.page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

export default Promotions
