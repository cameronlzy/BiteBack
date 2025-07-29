import { leaveQueue } from "@/services/queueService"
import React, { useEffect, useState } from "react"
import { Button } from "../ui/button"
import LoadingSpinner from "../common/LoadingSpinner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import OrderDisplay from "../preorder/OrderDisplay"
import { getOrderById } from "@/services/orderService"
import { getRestaurant } from "@/services/restaurantService"
import { toast } from "react-toastify"

const QueueStatus = ({
  customerQueueData,
  restaurantQueueData,
  setCurrentlyQueuing,
  queueNumToThousand,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queueStatus, setQueueStatus] = useState("Pending")
  const [restaurant, setRestaurant] = useState(null)
  const [existingCustomerOrder, setExistingCustomerOrder] = useState(null)
  const [showOrder, setShowOrder] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const newStatus =
      customerQueueData?.status === "called"
        ? "Called"
        : customerQueueData?.status === "skipped"
        ? "Skipped"
        : "Pending"
    setQueueStatus(newStatus)
    if (customerQueueData.status !== "waiting") {
      localStorage.removeItem("currentQueue")
    }
    const fetchRestaurant = async () => {
      try {
        const restaurant = await getRestaurant(customerQueueData.restaurant)
        setRestaurant(restaurant)
      } catch (ex) {
        toast.error("Unable to load restaurant details")
        throw ex
      }
    }
    fetchRestaurant()
  }, [customerQueueData])

  useEffect(() => {
    const fetchExistingOrder = async () => {
      const orderId = localStorage.getItem("order_id")
      if (!orderId) return

      try {
        const existingOrder = await getOrderById(orderId)
        console.log(existingOrder)
        if (existingOrder?.status === "pending") {
          setExistingCustomerOrder(existingOrder)
        }
      } catch (ex) {
        setExistingCustomerOrder(null)
        throw ex
      }
    }

    fetchExistingOrder()

    window.addEventListener("order_id_change", fetchExistingOrder)
    return () =>
      window.removeEventListener("order_id_change", fetchExistingOrder)
  }, [])

  const handleLeaveQueue = async () => {
    setIsSubmitting(true)
    try {
      await leaveQueue(customerQueueData._id)
      localStorage.removeItem("queueEntry")
      localStorage.removeItem("currentQueue")
      localStorage.removeItem("order_items")
      setCurrentlyQueuing(false)
    } catch (ex) {
      console.error("Failed to leave queue", ex)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreOrderNavigate = () => {
    localStorage.setItem("currentQueue", customerQueueData?.restaurant)

    const navState = {
      from: location.pathname,
    }

    if (existingCustomerOrder) {
      navState.existingOrder = existingCustomerOrder
    }

    navigate(`/pre-order/${customerQueueData?.restaurant}`, {
      state: navState,
    })
  }

  const getQueueIndex = (pax) => {
    if (pax <= 2) return "small"
    if (pax <= 4) return "medium"
    return "large"
  }

  const groupsInFront =
    customerQueueData && restaurantQueueData
      ? Math.max(
          customerQueueData.queueNumber -
            (restaurantQueueData[getQueueIndex(customerQueueData.pax)]
              ?.calledNumber ?? 0) -
            2,
          0
        )
      : 0

  const statusConfig = {
    Pending: {
      icon: <Clock className="w-5 h-5" />,
      primaryText: "Waiting in queue",
    },
    Called: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      primaryText: "Called",
      subText: "Please proceed to counter",
    },
    Skipped: {
      icon: <AlertCircle className="w-5 h-5" />,
      primaryText: "Skipped",
      subText: "Please approach staff for assistance",
    },
  }

  return (
    <Card className="max-w-md mx-auto mt-8 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Your Current Queue Status</CardTitle>
        <CardDescription>
          We will notify when it reaches your turn, please avoid closing the
          browser
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4 mt-4">
        <div className="space-y-2 bg-muted/50 p-3 rounded-lg text-center">
          <div className="text-sm font-medium">Current Status</div>
          <div className="justify-center">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-2">
                {statusConfig[queueStatus].icon}
                <span className="font-semibold text-xl">
                  {statusConfig[queueStatus].primaryText}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {statusConfig[queueStatus].subText}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Queue Number</span>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {queueNumToThousand(
              customerQueueData?.queueNumber,
              customerQueueData?.pax
            )}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Guests in Party</span>
          <span className="font-medium">{customerQueueData?.pax}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Groups Ahead</span>
          <span className="font-medium">
            {groupsInFront >= 0 ? groupsInFront : "0"}
          </span>
        </div>
        <Separator />
        {queueStatus === "Pending" && (
          <div className="text-center">
            {existingCustomerOrder ? (
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowOrder((prev) => !prev)}
                  className="w-full"
                >
                  {showOrder ? "Hide Order" : "View Existing Order"}
                </Button>

                <AnimatePresence>
                  {showOrder && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-4"
                    >
                      <OrderDisplay
                        orderItems={existingCustomerOrder.items}
                        restaurant={restaurant}
                        handlePreOrderNavigate={handlePreOrderNavigate}
                        code={existingCustomerOrder.code}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              restaurant?.preordersEnabled && (
                <Button
                  variant="outline"
                  onClick={handlePreOrderNavigate}
                  disabled={isSubmitting}
                  className="w-full mb-4"
                >
                  Pre-Order
                </Button>
              )
            )}
            <Button
              variant="destructive"
              onClick={handleLeaveQueue}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" inline={true} /> Leaving Queue...
                </>
              ) : (
                "Leave Queue"
              )}
            </Button>
          </div>
        )}
        {queueStatus === "Skipped" && (
          <h1 className="text-muted-foreground">Avoid closing the browser</h1>
        )}
      </CardContent>
    </Card>
  )
}

export default QueueStatus
