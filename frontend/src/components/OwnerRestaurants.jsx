import { Fragment, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import RoundedActionButton from "@/components/common/RoundedActionButton"
import { Eye, Users, Store, Utensils } from "lucide-react"

const RestaurantsDashboard = ({ user }) => {
  const [restaurants, setRestaurants] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (user.role !== "owner") {
      navigate("/not-found", { replace: true })
      return
    }
    setRestaurants(user.profile.restaurants || [])
  }, [user._id])

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Restaurants Dashboard</h2>

      {restaurants.length === 0 ? (
        <p className="text-gray-500">No Owned Restaurants</p>
      ) : (
        <Fragment>
          {restaurants.map((res, index) => (
            <Card key={index} className="mb-4 shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{res.name}</span>
                  <div className="flex gap-2">
                    <div className="group">
                      <RoundedActionButton
                        to={`/restaurants/${res._id}`}
                        icon={Eye}
                        label="Details"
                        bgColor="bg-white"
                        hoverColor="hover:bg-gray-100"
                        textColor="text-black"
                        expandedWidth="group-hover:w-[100px]"
                      />
                    </div>
                    <div className="group">
                      <RoundedActionButton
                        to={`/online-queue/${res._id}`}
                        icon={Users}
                        label="Queue"
                        bgColor="bg-white"
                        hoverColor="hover:bg-gray-100"
                        textColor="text-black"
                        expandedWidth="group-hover:w-[100px]"
                      />
                    </div>
                    <div className="group">
                      <RoundedActionButton
                        to={`/current-rewards/${res._id}`}
                        icon={Store}
                        label="Rewards"
                        bgColor="bg-indigo-600"
                        hoverColor="hover:bg-indigo-700"
                        expandedWidth="group-hover:w-[110px]"
                      />
                    </div>
                    <div className="group">
                      <RoundedActionButton
                        to={`/pre-order/${res._id}`}
                        icon={Utensils}
                        label="Menu"
                        bgColor="bg-green-700"
                        hoverColor="hover:bg-green-800"
                        textColor="text-white"
                        expandedWidth="group-hover:w-[90px]"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </Fragment>
      )}
    </div>
  )
}

export default RestaurantsDashboard
