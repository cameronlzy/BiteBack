import React, { useEffect, useRef, useState } from "react"
import {
  getRestaurantQueueOverview,
  updateQueueEntryStatus,
  callNextCustomer,
} from "@/services/staffService"
import { toggleQueueEnabled } from "@/services/queueService"
import { getRestaurant } from "@/services/restaurantService"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import LoadingSpinner from "../common/LoadingSpinner"
import { handle401 } from "@/utils/handleStaffTimeout"
import { getShortAddress } from "@/utils/stringRegexUtils"
import { AnimatePresence, motion } from "framer-motion"
import OrderDisplay from "../preorder/OrderDisplay"
import { assignTable, getOrderByCustomerId } from "@/services/orderService"
import SubmitButton from "../common/SubmitButton"
import { Input } from "../ui/input"

const StaffQueue = () => {
  const [queue, setQueue] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [queueEnabled, setQueueEnabled] = useState(null)
  const [togglingQueue, setTogglingQueue] = useState(false)
  const [calledCustomers, setCalledCustomers] = useState(
    JSON.parse(localStorage.getItem("called_customer")) || []
  )
  const [loadingOrderId, setLoadingOrderId] = useState(null)
  const [seatingLoadingId, setSeatingLoadingId] = useState(null)
  const seatingInputRef = useRef()
  const [currentOrder, setCurrentOrder] = useState(null)
  const restaurantId = localStorage.getItem("restaurant")

  useEffect(() => {
    fetchRestaurant()
    fetchQueue()
  }, [])

  const fetchRestaurant = async () => {
    try {
      const data = await getRestaurant(restaurantId)
      setRestaurant(data)
      setQueueEnabled(data.queueEnabled)
    } catch (ex) {
      if (!(await handle401(ex))) {
        toast.error("Failed to load restaurant info")
      }
    }
  }

  const fetchQueue = async () => {
    try {
      const handleQueue = async () => {
        const data = await getRestaurantQueueOverview(restaurantId)
        setQueue(data)
        return
      }
      handleQueue()
      const intervalId = setInterval(handleQueue, 10000)
      return () => clearInterval(intervalId)
    } catch (ex) {
      if (!(await handle401(ex))) {
        toast.error("Failed to load queue")
      }
    }
  }

  const handleCallNext = async (group) => {
    try {
      const data = await callNextCustomer(restaurantId, group)
      if (!data) {
        toast.info("No customers waiting in this queue")
        return
      }
      const updated = [...calledCustomers, { ...data, group }]
      setCalledCustomers(updated)
      localStorage.setItem("called_customer", JSON.stringify(updated))
      toast.success(`Called next in ${group} queue`)
      await fetchQueue()
    } catch {
      toast.error("Failed to call next customer")
    }
  }

  const handleUpdateStatus = async (entryId, status) => {
    try {
      await updateQueueEntryStatus(entryId, status)
      toast.success(`Marked ${status}`, {
        toastId: entryId,
      })
      await fetchQueue()
      const updated = calledCustomers.filter((e) => e._id !== entryId)
      setCalledCustomers(updated)
      localStorage.setItem("called_customer", JSON.stringify(updated))
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleToggleQueue = async () => {
    setTogglingQueue(true)
    try {
      const updated = await toggleQueueEnabled(restaurantId, !queueEnabled)
      setQueueEnabled(updated.queueEnabled)
      toast.success(`Queue ${updated.queueEnabled ? "enabled" : "disabled"}`)
    } catch {
      toast.error("Failed to toggle queue")
    } finally {
      setTogglingQueue(false)
    }
  }

  const handleGetCustomerOrder = async (customerId, entryId) => {
    setLoadingOrderId(customerId)
    try {
      const order = await getOrderByCustomerId(customerId)
      order
        ? setCurrentOrder({
            ...order,
            entryId: entryId,
          })
        : setCurrentOrder({
            entryId: entryId,
            customer: customerId,
            items: [],
          })
    } catch (ex) {
      toast.error("Failed to fetch customer order")
      throw ex
    } finally {
      setLoadingOrderId(null)
    }
  }

  const handleSeating = async (seatNumber, orderId, entryId) => {
    setSeatingLoadingId(orderId)
    try {
      if (!orderId) {
        await updateQueueEntryStatus(entryId, "seated")
      } else {
        await Promise.all([
          assignTable(orderId, seatNumber),
          updateQueueEntryStatus(entryId, "seated"),
        ])
      }
      toast.success(`Marked Seated for seat ${seatNumber}`)
      const updated = calledCustomers.filter(
        (c) => c.customer !== currentOrder.customer
      )
      setCalledCustomers(updated)
      localStorage.setItem("called_customer", JSON.stringify(updated))

      setCurrentOrder(null)
      await fetchQueue()
    } catch (ex) {
      toast.error("Failed to mark as seated")
      console.error(ex)
    } finally {
      setSeatingLoadingId(null)
    }
  }

  const queueGroups = [
    { label: "1-2 Pax", key: "small" },
    { label: "3-4 Pax", key: "medium" },
    { label: "5+ Pax", key: "large" },
  ]

  const offsets = {
    small: 1000,
    medium: 2000,
    large: 3000,
  }

  const wrapQueueNumber = (base, offset) => {
    const number = base + offset
    return number > 9999 ? offset : number
  }

  if (!queue) return <LoadingSpinner />

  return (
    <div className="p-6">
      <div className="border p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center">
        <div>
          {restaurant ? (
            <h2 className="text-xl font-semibold">
              {restaurant.name}{" "}
              <span className="text-muted-foreground">
                @ {getShortAddress(restaurant.address)}
              </span>
            </h2>
          ) : (
            <h2 className="text-xl font-semibold text-muted-foreground">
              Loading restaurant info...
            </h2>
          )}
        </div>
        <Button
          variant={queueEnabled ? "destructive" : "default"}
          onClick={handleToggleQueue}
          disabled={togglingQueue}
        >
          {togglingQueue
            ? "Toggling..."
            : queueEnabled
            ? "Disable Queue"
            : "Enable Queue"}
        </Button>
      </div>

      {queueGroups.map(({ label, key }) => (
        <div
          key={key}
          className="border rounded-xl p-5 my-6 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{label} Queue</h2>
            <Button
              size="sm"
              onClick={() => handleCallNext(key)}
              className="bg-amber-400 hover:bg-amber-600"
              disabled={!queue[key]?.waiting?.length}
            >
              Call Next
            </Button>
          </div>

          <div className="flex gap-4 flex-wrap text-sm font-mono">
            <Badge>
              Most Recent Number:{" "}
              {wrapQueueNumber(queue[key]?.lastNumber, offsets[key])}
            </Badge>
            <Badge>
              Now Calling:{" "}
              {wrapQueueNumber(queue[key]?.calledNumber, offsets[key])}
            </Badge>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium">Upcoming Customers</h3>
            {queue[key]?.waiting.slice(0, 3).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No one waiting in this queue.
              </p>
            ) : (
              queue[key]?.waiting.slice(0, 3).map((entry, index) => (
                <div
                  key={
                    entry._id ? `${key}-${entry._id}` : `${key}-entry-${index}`
                  }
                  className="border rounded-lg px-4 py-3 flex justify-between items-center"
                >
                  <span className="font-mono text-sm">
                    #{wrapQueueNumber(entry.queueNumber, offsets[key])} | Pax:{" "}
                    {entry.pax}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {currentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setCurrentOrder(null)}
          >
            <div
              className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <OrderDisplay isStaff={true} orderItems={currentOrder.items} />
              <div className="mt-6 flex justify-between items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentOrder(null)}
                  className="shrink-0"
                >
                  Close
                </Button>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const seatNumber = seatingInputRef.current.value
                    handleSeating(
                      seatNumber,
                      currentOrder._id,
                      currentOrder?.entryId
                    )
                  }}
                  className="flex items-center space-x-2 w-full justify-end"
                >
                  <Input
                    type="text"
                    placeholder="Seat Number"
                    ref={seatingInputRef}
                    className="h-8 w-32"
                  />
                  <SubmitButton
                    size="sm"
                    type="submit"
                    className="bg-gray-700 hover:bg-black"
                    condition={seatingLoadingId === currentOrder._id}
                    loadingText="Seating..."
                    normalText="Mark Seated"
                  />
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {calledCustomers.length > 0 && (
        <div className="border-t mt-8 pt-6">
          <h2 className="text-xl font-semibold mb-4">Called Customers</h2>
          <div className="space-y-3">
            {calledCustomers.map((entry) => (
              <div
                key={entry._id}
                className="border rounded-lg px-4 py-3 flex justify-between items-center"
              >
                <span className="font-mono text-sm">
                  #{wrapQueueNumber(entry.queueNumber, offsets[entry.group])} |
                  Pax: {entry.pax}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-800"
                    onClick={() =>
                      handleGetCustomerOrder(entry.customer, entry._id)
                    }
                    disabled={loadingOrderId === entry.customer}
                  >
                    {loadingOrderId === entry.customer ? (
                      <LoadingSpinner size="sm" inline={true} />
                    ) : (
                      "Check Order"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateStatus(entry._id, "skipped")}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffQueue
