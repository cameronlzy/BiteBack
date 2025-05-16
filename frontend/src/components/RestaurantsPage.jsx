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

const Restaurants = ({ restaurants, onChange }) => {
  const columns = []
  for (let i = 0; i < restaurants.length; i += 2) {
    columns.push(restaurants.slice(i, i + 2))
  }
  return (
    <div className="w-full px-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Top Visited Restaurants
      </h2>
      <SearchBar name="Search" onChange={onChange} />
      <div className="overflow-x-auto w-full py-4">
        <div className="flex gap-4">
          {columns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="flex flex-col space-y-4 min-w-[280px] max-w-[280px]"
            >
              {column.map(({ imageUrl, name, description, address, id }) => (
                <Card
                  className="w-[280px] h-auto p-4 rounded-xl shadow-md space-y-3"
                  key={id}
                >
                  <div>
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-36 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                  </div>

                  <div className="text-center sm:text-left space-y-2 w-full break-words">
                    <CardTitle className="text-2xl font-bold">
                      <Link
                        to={`${id}`}
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
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Restaurants
