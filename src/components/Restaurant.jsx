import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

const Restaurant = ({ restaurant }) => {
  const { id, imageUrl, name, description, address } = restaurant
  return (
    <div className="w-full max-w-4xl mx-auto mt-6 px-4">
      <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-md">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-end p-4">
          <h1 className="text-3xl font-bold text-white ">{name}</h1>
        </div>
      </div>

      <Card className="mt-6 shadow-sm">
        <CardHeader>
          <CardTitle>Description</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-700">
            <strong>Address:</strong> {address}
          </div>

          <Link to={`/reservation/${id}`}>
            <Button
              className="w-full md:w-auto 
            bg-black 
            hover:bg-gray-800 
            text-white 
            transition-colors 
            cursor-pointer"
            >
              Make a Reservation
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default Restaurant
