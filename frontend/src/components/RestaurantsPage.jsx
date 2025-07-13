import { useEffect, useState } from "react"
import { getRestaurants } from "@/services/restaurantService"
import SearchBar from "./SearchBar"
import SortBy from "./common/SortBy"
import RestaurantCard from "./common/RestaurantCard"
import Pagination from "./common/Pagination"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "./ui/button"
import { Utensils } from "lucide-react"
import { toast } from "react-toastify"
import LoadingSpinner from "./common/LoadingSpinner"

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page")) || 1
  const sortBy = searchParams.get("sortBy") || "name"
  const order = searchParams.get("order") || "asc"
  const search = searchParams.get("search") || ""
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    setSearchInput(search)
  }, [search])
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRestaurants({
          page,
          sortBy,
          order,
          search: search.trim() === "" ? null : search,
        })
        setRestaurants(data.restaurants)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      } catch {
        toast.error("Failed to fetch restaurants")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, sortBy, order, search])
  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSearchParams({
      page: 1,
      sortBy,
      order,
      search: searchInput.trim(),
    })
    setIsSubmitting(false)
  }

  const handleSort = ({ value, direction }) => {
    setSearchParams({
      page: 1,
      search,
      sortBy: value,
      order: direction,
    })
  }

  const handlePageChange = (newPage) => {
    setSearchParams({
      page: newPage,
      search,
      sortBy,
      order,
    })
  }

  const options = [
    { label: "Name", value: "name" },
    { label: "Rating", value: "averageRating" },
    { label: "Number of Reviews", value: "reviewCount" },
  ]

  if (loading) return <LoadingSpinner />

  return (
    <div className="w-full px-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Restaurants</h2>

      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-4 mb-4 px-4">
        <Link to="/search-discovery">
          <Button variant="outline" className="rounded-full">
            <Utensils className="w-4 h-4" />
            Discover
          </Button>
        </Link>

        <SearchBar
          name="Search"
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={handleSearchSubmit}
          isSubmitting={isSubmitting}
        />

        <SortBy
          options={options}
          items={restaurants}
          backendHandle={true}
          onSorted={handleSort}
        />
      </div>

      <div className="max-w-4xl mx-auto py-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant._id}
            {...restaurant}
            currentTag={searchInput}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default Restaurants
