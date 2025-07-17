import { useEffect, useState } from "react"
import {
  getOrdersByRestaurant,
  updateOrderStatus,
} from "@/services/orderService"
import { getRestaurant } from "@/services/restaurantService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { UtensilsCrossed } from "lucide-react"
import { useNavigate } from "react-router-dom"

const KitchenOrders = ({ user }) => {
  const [orders, setOrders] = useState([])
  const [restaurant, setRestaurant] = useState(null)
  const navigate = useNavigate()

  const fetchOrders = async () => {
    try {
      const data = await getOrdersByRestaurant(user?.restaurant, {
        status: "preparing",
      })
      setOrders(data)
    } catch (ex) {
      toast.error("Failed to fetch orders")
      console.error(ex)
    }
  }

  const fetchRestaurant = async () => {
    try {
      const data = await getRestaurant(user?.restaurant)
      setRestaurant(data)
    } catch (ex) {
      toast.error("Failed to fetch restaurant")
      console.error(ex)
    }
  }

  const handleMarkCompleted = async (orderId) => {
    try {
      await updateOrderStatus(orderId, "completed")
      toast.success("Order marked as completed")
      fetchOrders()
    } catch (ex) {
      toast.error("Failed to update order")
      console.error(ex)
    }
  }

  useEffect(() => {
    fetchRestaurant()
    fetchOrders()
  }, [])

  return (
    <div className="space-y-4 px-4 py-6">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-2xl font-bold">
          Orders for {restaurant?.name || "Restaurant"}
        </h1>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
          onClick={() =>
            navigate(`/pre-order/${restaurant?._id}`, {
              state: {
                from: location.pathname,
              },
            })
          }
        >
          <UtensilsCrossed className="w-4 h-4" />
          Manage Menu
        </Button>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-muted-foreground">No pending orders</p>
      ) : (
        orders.map((order) => (
          <Card key={order._id}>
            <CardHeader>
              <CardTitle>
                Order #{order.code || order._id.slice(-4)} @ Table{" "}
                {order?.tableNumber}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 pl-5 list-disc text-base">
                {order.items.map((item, index) => (
                  <li key={index}>
                    <div className="font-bold gap-2">
                      {item.name}{" "}
                      <span className="font-normal">x{item.quantity}</span>
                    </div>
                    {item.remarks && (
                      <div className="text-sm text-muted-foreground italic ml-1">
                        &quot;{item.remarks}&quot;
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="w-full"
                onClick={() => handleMarkCompleted(order._id)}
              >
                Mark as Completed
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export default KitchenOrders
