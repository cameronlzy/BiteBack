import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { getPromotions } from "@/services/promotionService"
import PromotionCard from "./PromotionCard"
import Pagination from "../common/Pagination"
import { toast } from "react-toastify"
import SearchBar from "../SearchBar"
import SortBy from "../common/SortBy"
import LoadingSpinner from "../common/LoadingSpinner"
import NoResultsFound from "../common/NoResultsFound"

const Promotions = ({ user }) => {
  const [promotions, setPromotions] = useState([])
  const [searchInput, setSearchInput] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page")) || 1
  const sortBy = searchParams.get("sortBy") || "startDate"
  const order = searchParams.get("order") || "asc"
  const search = searchParams.get("search") || ""

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { promotions, totalPages, totalCount } = await getPromotions({
          page,
          limit: 10,
          sortBy,
          order,
          search: search.trim() === "" ? null : search,
        })
        setPromotions(promotions)
        setTotalPages(totalPages)
        setTotalCount(totalCount)
      } catch {
        toast.error("Failed to fetch promotions")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, sortBy, order, search])

  const handlePageChange = (newPage) => {
    setSearchParams({
      page: newPage,
      sortBy,
      order,
      search,
    })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchParams({
      page: 1,
      sortBy,
      order,
      search: searchInput.trim(),
    })
  }

  const handleSort = ({ value, direction }) => {
    setSearchParams({
      page: 1,
      search,
      sortBy: value,
      order: direction,
    })
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
        />

        <SortBy
          options={options}
          items={promotions}
          backendHandle={true}
          onSorted={handleSort}
        />
      </div>

      {promotions.length === 0 ? (
        <NoResultsFound text="No promotions found." />
      ) : (
        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {promotions.map((promo) => (
            <PromotionCard key={promo._id} {...promo} user={user} />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

export default Promotions
