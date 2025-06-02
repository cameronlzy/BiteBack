import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { MapPin } from "lucide-react"
import SearchBar from "./SearchBar"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { getRestaurants } from "@/services/restaurantService"
import SortBy from "./common/SortBy"

const Restaurants = () => {
  const [allRestaurants, setAllRestaurants] = useState([])
  const [filterTerm, setFilterTerm] = useState("")
  const [sortedRestaurants, setSortedRestaurants] = useState([])
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const fetchedRestaurants = await getRestaurants()
        setAllRestaurants(fetchedRestaurants)
        setRestaurants(fetchedRestaurants)
      } catch (ex) {}
    }
    fetchRestaurants()
  }, [])

  useEffect(() => {
    const filtered = allRestaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(filterTerm.toLowerCase())
    )
    setSortedRestaurants(filtered)
  }, [allRestaurants, filterTerm])

  const handleSearch = (searchTerm) => {
    setFilterTerm(searchTerm)
  }

  const options = [
    { label: "Name", value: "name" },
    { label: "Address", value: "address" },
    // { label: "Rating", value: "rating" },
  ]

  return (
    <div className="w-full px-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Top Visited Restaurants
      </h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex-1">
          <SearchBar name="Search" onChange={handleSearch} />
        </div>
        <SortBy
          options={options}
          items={sortedRestaurants}
          onSorted={setSortedRestaurants}
        />
      </div>
      <div className="w-full py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sortedRestaurants.map(
            ({ imageUrl, name, description, address, _id }) => (
              <Card
                className="w-full h-auto p-4 rounded-xl shadow-md space-y-3"
                key={_id}
              >
                <div>
                  <img
                    src={
                      imageUrl
                        ? imageUrl
                        : "https://www.opentable.com/img/restimages/2038.jpg"
                    }
                    alt={name}
                    className="w-full h-36 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>

                <div className="text-center sm:text-left space-y-2 w-full break-words">
                  <CardTitle className="text-2xl font-bold">
                    <Link
                      to={`${_id}`}
                      className="text-black hover:text-gray-700 hover:underline transition-colors"
                    >
                      {name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {description}
                  </CardDescription>
                  <div className="flex items-center justify-center sm:justify-start text-sm text-gray-700">
                    <MapPin className="w-4 h-4 mr-1" />
                    {address}
                  </div>
                </div>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default Restaurants
