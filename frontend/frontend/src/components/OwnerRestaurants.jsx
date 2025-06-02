import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

const OwnerRestaurants = ({ user }) => {
  const [restaurants, setRestaurants] = useState([])
  const navigate = useNavigate()
  useEffect(() => {
    if (user.role !== "owner") {
      navigate("/not-found", { replace: true })
      return
    }
    setRestaurants(user.profile.restaurants || [])
  }, [user._id])

  const handleSelect = (restId) => {
    return navigate(`/restaurants/${restId}`, { replace: true })
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Restaurants Owned</h2>
      <Button className="mb-4" onClick={() => navigate("/restaurants/new")}>
        Add New Restaurant
      </Button>

      {restaurants.length === 0 ? (
        <p className="text-gray-500">No Owned Restaurants</p>
      ) : (
        restaurants.map((res, index) => (
          <Card key={index} className="mb-4 shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{res.name}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelect(res._id)}
                >
                  See Details
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  )
}

export default OwnerRestaurants
