import {
  closeEventSource,
  createQueueEventSource,
  leaveQueue,
} from "@/services/queueService"
import React, { useEffect, useState } from "react"
import { Button } from "./ui/button"
import LoadingSpinner from "./common/LoadingSpinner"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card"
import { Separator } from "./ui/separator"
import { Badge } from "./ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"

const QueueStatus = ({
  customerQueueData,
  restaurantQueueData,
  setCurrentlyQueuing,
  queueNumToThousand,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queueStatus, setQueueStatus] = useState("Pending")

  useEffect(() => {
    const newStatus =
      customerQueueData?.status === "called"
        ? "Called"
        : customerQueueData?.status === "skipped"
        ? "Skipped"
        : "Pending"
    setQueueStatus(newStatus)
  }, [customerQueueData])

  useEffect(() => {
    if (!customerQueueData?._id) return

    const handleStatusUpdate = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.queueEntry === "seated") {
          return
        }

        if (data.queueEntry === customerQueueData._id) {
          const newStatus =
            data.status === "called"
              ? "Called"
              : data.status === "skipped"
              ? "Skipped"
              : "Pending"
          setQueueStatus(newStatus)
        }
      } catch (error) {
        console.error("Error processing SSE message:", error)
      }
    }

    const es = createQueueEventSource(customerQueueData._id, handleStatusUpdate)

    return () => {
      closeEventSource(es)
    }
  }, [customerQueueData?._id])

  const handleLeaveQueue = async () => {
    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await leaveQueue(customerQueueData._id)
      localStorage.removeItem("queueId")
      setCurrentlyQueuing(false)
    } catch (ex) {
      console.error("Failed to leave queue", ex)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getQueueIndex = (pax) => {
    if (pax <= 2) return 0
    if (pax <= 4) return 1
    return 2
  }

  const groupsInFront =
    customerQueueData && restaurantQueueData
      ? customerQueueData.queueNumber -
        (restaurantQueueData[getQueueIndex(customerQueueData.pax)]
          ?.currentQueueNumber ?? 0)
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
