import { useState } from "react"
import { Input } from "@/components/ui/input"
import SubmitButton from "@/components/common/SubmitButton"
import OrderDisplay from "@/components/preorder/OrderDisplay"
import { getOrderByCode } from "@/services/orderService"
import { toast } from "react-toastify"

const OrderLookup = () => {
  const [codeInput, setCodeInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [order, setOrder] = useState(null)

  const handleSearch = async () => {
    if (!codeInput.trim()) {
      toast.error("Please enter an order code.")
      return
    }

    setLoading(true)
    setOrder(null)

    try {
      const data = await getOrderByCode(codeInput.trim())
      setOrder(data)
    } catch (ex) {
      if (ex.response?.status === 404) {
        setNotFound(true)
      } else if (ex.response?.status === 400) {
        toast.error("Invalid order code format")
      } else {
        console.error("Error fetching order:", ex)
        toast.error("An error occurred while fetching the order")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Enter Order Code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
        />
        <SubmitButton
          type="button"
          onClick={handleSearch}
          condition={loading}
          normalText="Find Order"
          loadingText="Searching..."
        />
      </div>
      {order ? (
        <OrderDisplay
          orderItems={order.items}
          code={order.code}
          restaurant={order.restaurant}
        />
      ) : notFound ? (
        <p className="text-red-600">
          Order not found. Please check the code and try again.
        </p>
      ) : (
        <p className="text-gray-500">Enter an order code to view details.</p>
      )}
    </div>
  )
}

export default OrderLookup
