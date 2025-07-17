import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCustomerPastOrders } from "@/services/orderService"
import LoadingSpinner from "../common/LoadingSpinner"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"

const PreviousOrderBar = ({
  customerId,
  setOrderItems,
  restaurantId,
  currentlyInQueue,
}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastAddedOrderId, setLastAddedOrderId] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await getCustomerPastOrders({
        page,
        limit: 3,
        restaurantId,
      })
      setOrders(data.orders || [])
      setTotalPages(data.totalPages || 1)
    } catch (ex) {
      console.error("Failed to fetch past orders", ex)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchOrders()
    }
  }, [customerId, page])

  if (loading) {
    return (
      <div className="w-full flex justify-center py-4">
        <LoadingSpinner />
      </div>
    )
  }

  if (!Array.isArray(orders) || orders.length === 0) return null

  return (
    <div className="w-full px-4 py-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Previous Orders</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto">
        {orders.map((order) => (
          <Card
            key={order._id}
            className={`w-[215px] flex-shrink-0 flex flex-col justify-between ${
              currentlyInQueue ? "h-54" : "h-40"
            }`}
          >
            <CardHeader className="pb-">
              <CardTitle className="text-sm font-medium truncate">
                Order #{order.code || order._id.slice(-4)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden text-sm space-y-1">
              <ul className="list-disc list-inside max-h-[72px]">
                {order.items.slice(0, 2).map((item, i) => (
                  <li key={i} className="truncate">
                    {item.name} x{item.quantity}
                  </li>
                ))}
                {order.items.length > 2 && (
                  <li className="list-none text-muted-foreground italic text-sm text-center">
                    +{order.items.length - 2} more
                  </li>
                )}
              </ul>
            </CardContent>
            {currentlyInQueue && (
              <CardContent className="pt-1">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const mappedItems = order.items.map((item) => {
                      const mapped = { ...item, _id: item.item }
                      delete mapped.item
                      return mapped
                    })
                    setOrderItems(mappedItems)
                    setLastAddedOrderId(order._id)
                    setTimeout(() => setLastAddedOrderId(null), 1000)
                  }}
                >
                  {lastAddedOrderId === order._id ? (
                    <div className="flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" />
                      Added
                    </div>
                  ) : (
                    "Order Again"
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default PreviousOrderBar
