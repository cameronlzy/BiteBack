import { useEffect, useState } from "react"
import { getRestaurants } from "@/services/restaurantService"
import SearchBar from "./SearchBar"
import SortBy from "./common/SortBy"
import RestaurantCard from "./common/RestaurantCard"
import Pagination from "./common/Pagination"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Utensils } from "lucide-react"
import { toast } from "react-toastify"
import LoadingSpinner from "./common/LoadingSpinner"

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([])
  const [params, setParams] = useState({
    search: null,
    sortBy: null,
    order: null,
    page: 1,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [triggeredSearch, setTriggeredSearch] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [totalPages, setTotalPages] = useState(1)
  const [restored, setRestored] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!restored) return

    sessionStorage.setItem(
      "restaurantState",
      JSON.stringify({
        params,
        restaurants,
        searchInput,
        totalPages,
        totalCount,
      })
    )
  }, [params, restaurants, searchInput, totalPages, totalCount, restored])

  useEffect(() => {
    const saved = sessionStorage.getItem("restaurantState")
    if (saved) {
      const { params, restaurants, searchInput, totalPages, totalCount } =
        JSON.parse(saved)
      setParams(params)
      setRestaurants(restaurants)
      setSearchInput(searchInput)
      setTotalPages(totalPages)
      setTotalCount(totalCount)
    } else {
      setParams({
        search: null,
        sortBy: null,
        order: null,
        page: 1,
      })
    }

    setRestored(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!restored) return

      try {
        const cleanParams = {
          ...params,
          search:
            typeof params.search === "string" && params.search.trim() === ""
              ? null
              : params.search,
        }

        const data = await getRestaurants(cleanParams)
        console.log(data)
        setRestaurants(data.restaurants)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      } catch {
        toast.error("Failed to fetch restaurants")
      } finally {
        setLoading(false)
        if (triggeredSearch) {
          setIsSubmitting(false)
          setTriggeredSearch(false)
        }
      }
    }
    fetchData()
  }, [params, restored])
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setParams((prev) => ({
      ...prev,
      page: newPage,
    }))
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
        currentPage={params.page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default Restaurants
