import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card"
import { Button } from "../ui/button"
import { X } from "lucide-react"
import OrderItemSummary from "./OrderItemSummary"
import { toast } from "react-toastify"
import SubmitButton from "../common/SubmitButton"

const OrderConfirmationPage = ({
  showConfirm,
  onClose,
  onSubmit,
  orderItems,
  restaurantId,
  isExisting,
  setShowConfirm,
}) => {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const orderPayload = {
      type: "preorder",
      restaurant: restaurantId,
      items: orderItems.map(({ _id, quantity, remarks }) => ({
        item: _id,
        quantity,
        remarks,
      })),
    }

    try {
      setLoading(true)
      await onSubmit(orderPayload)
      onClose()
    } catch (ex) {
      toast.error("Failed to submit order")
      throw ex
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {showConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto pt-20 px-4"
          onClick={() => setShowConfirm(false)}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-lg w-full"
          >
            <Card className="shadow-xl border border-muted-foreground/10">
              <CardHeader className="pb-2 border-b flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  Confirm Order
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {orderItems.length > 0 ? (
                  orderItems.map((item, index) => (
                    <OrderItemSummary key={index} {...item} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Your cart is empty
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-4 flex flex-col space-y-2">
                <div className="w-full flex justify-between text-base font-medium mb-4">
                  <span>Total</span>
                  <span>
                    $
                    {orderItems
                      .reduce(
                        (sum, item) => sum + item.price * item.quantity,
                        0
                      )
                      .toFixed(2)}
                  </span>
                </div>
                <SubmitButton
                  onClick={handleSubmit}
                  condition={loading}
                  disabled={orderItems.length === 0}
                  className="w-full"
                  loadingText={isExisting ? "Updating..." : "Submitting..."}
                  normalText={isExisting ? "Update Order" : "Submit Order"}
                />
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OrderConfirmationPage
