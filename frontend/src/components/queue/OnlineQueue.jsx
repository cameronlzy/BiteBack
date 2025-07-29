import React, { useEffect, useState } from "react"
import {
  Table,
  TableCell,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
} from "../ui/table"
import JoinQueue from "./JoinQueue"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getRestaurant } from "@/services/restaurantService"
import {
  getCurrentCustomerQueue,
  joinQueue,
  getCurrentRestaurantQueue,
} from "@/services/queueService"
import { toast } from "react-toastify"
import LoadingSpinner from "../common/LoadingSpinner"
import BackButton from "../common/BackButton"
import QueueStatus from "./QueueStatus"
import { isWithinOpeningHours } from "@/utils/timeConverter"
import { userIsOwner } from "@/utils/ownerCheck"

const queueNumToThousand = (queueNumber, pax) => {
  if (pax > 0 && pax <= 2) {
    return (queueNumber % 1000) + 1000
  } else if (pax > 2 && pax <= 4) {
    return (queueNumber % 1000) + 2000
  } else if (pax > 4) {
    return (queueNumber % 1000) + 3000
  } else {
    return -1
  }
}
const OnlineQueue = ({ user }) => {
  const [currentlyQueuing, setCurrentlyQueuing] = useState(false)
  const [customerQueueData, setCustomerQueueData] = useState(null)
  const [restaurantQueueData, setRestaurantQueueData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [restaurant, setRestaurant] = useState(null)
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    location.state?.from || userIsOwner(user)
      ? "/restaurants"
      : `/restaurants/${restaurantId}`

  useEffect(() => {
    async function fetchRestaurantandQueue() {
      try {
        const rest = await getRestaurant(restaurantId)
        setRestaurant(rest)
        const normalRestaurantQueueData = await getCurrentRestaurantQueue(
          restaurantId
        )
        // const finalData = {
        //   currentQueueNumber,
        //   groupsAhead: lastNumber - currentQueueNumber,
        // }
        setRestaurantQueueData(normalRestaurantQueueData)
        setIsLoading(false)
      } catch (ex) {
        if (ex.response && ex.response.status === 404) {
          navigate("/not-found", { replace: true })
          return
        }
        toast.error("Failed to fetch Restaurant")
        throw ex
      }
    }
    fetchRestaurantandQueue()
  }, [restaurantId, navigate])

  useEffect(() => {
    const queueEntry = JSON.parse(localStorage.getItem("queueEntry") || "{}")
    if (
      user.role === "customer" &&
      queueEntry?._id &&
      queueEntry?.restaurantId === restaurantId
    ) {
      async function fetchData() {
        const data = await getCurrentCustomerQueue(queueEntry._id)
        if (
          data?.status &&
          data?.status !== "seated" &&
          data?.status !== "skipped"
        ) {
          setCurrentlyQueuing(true)
          setCustomerQueueData(data)
        } else {
          if (data?.status === "skipped") {
            setCurrentlyQueuing(true)
            setCustomerQueueData(data)
          } else {
            setCurrentlyQueuing(false)
            setCustomerQueueData(null)
          }
          localStorage.removeItem("queueId")
          return
        }
      }
      fetchData()

      const intervalId = setInterval(fetchData, 10000)
      return () => clearInterval(intervalId)
    }
  }, [user, restaurantId, currentlyQueuing])

  const handleJoin = async (queueDetails) => {
    if (user.role !== "customer") {
      toast.info("Only Customers can join queue")
      return
    }
    try {
      const queueResponse = await joinQueue(queueDetails)
      localStorage.setItem(
        "queueEntry",
        JSON.stringify({
          _id: queueResponse._id,
          restaurantId: queueResponse.restaurant,
        })
      )
      toast.success("Successfully joined queue")
      setCurrentlyQueuing(true)
    } catch (ex) {
      if (ex.response?.status === 403) {
        toast.error("User not allowed to join queue")
      }
    }
  }

  const stillLoading = isLoading || (currentlyQueuing && !customerQueueData)

  if (stillLoading) return <LoadingSpinner />
  if (
    (!stillLoading && !isWithinOpeningHours(restaurant.openingHours)) ||
    !restaurant.queueEnabled
  )
    return <h1> Online Queue Closed </h1>
  return (
    <React.Fragment>
      <BackButton from={from} />
      <div className="space-y-4 mb-6">
        <h1 className="text-4xl font-bold text-center">Current Queue</h1>
        <div className="flex justify-center items-end">
          <h2 className="text-xl italic text-gray-500">
            {restaurant.name} @ {restaurant.address}
          </h2>
        </div>
      </div>
      {!currentlyQueuing ? (
        <React.Fragment>
          <div className="rounded-lg overflow-hidden border border-black">
            <Table className="text-lg w-full">
              <TableHeader className="bg-black text-white">
                <TableRow>
                  <TableHead className="text-white text-center">Pax</TableHead>
                  <TableHead className="text-white text-center">
                    Current
                  </TableHead>
                  <TableHead className="text-white text-center">
                    Groups Ahead
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                <TableRow className="border-t border-black">
                  <TableCell className="font-medium border-r border-black">
                    1-2 Pax
                  </TableCell>
                  <TableCell className="text-xl font-bold border-r border-black">
                    {(restaurantQueueData.small.calledNumber % 1000) + 1000}
                  </TableCell>
                  <TableCell className="text-xl font-bold">
                    {Math.max(
                      restaurantQueueData.small.lastNumber -
                        restaurantQueueData.small.calledNumber -
                        1,
                      0
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t border-black">
                  <TableCell className="font-medium border-r border-black">
                    3-4 Pax
                  </TableCell>
                  <TableCell className="text-xl font-bold border-r border-black">
                    {(restaurantQueueData.medium.calledNumber % 1000) + 2000}
                  </TableCell>
                  <TableCell className="text-xl font-bold">
                    {Math.max(
                      restaurantQueueData.medium.lastNumber -
                        restaurantQueueData.medium.calledNumber -
                        1,
                      0
                    )}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t border-black">
                  <TableCell className="font-medium border-r border-black">
                    5+ Pax
                  </TableCell>
                  <TableCell className="text-xl font-bold border-r border-black">
                    {(restaurantQueueData.large.calledNumber % 1000) + 3000}
                  </TableCell>
                  <TableCell className="text-xl font-bold">
                    {Math.max(
                      restaurantQueueData.large.lastNumber -
                        restaurantQueueData.large.calledNumber -
                        1,
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {user?.role === "customer" && (
            <JoinQueue onJoin={handleJoin} restaurantId={restaurantId} />
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <QueueStatus
            queueNumToThousand={queueNumToThousand}
            customerQueueData={customerQueueData}
            restaurantQueueData={restaurantQueueData}
            setCurrentlyQueuing={setCurrentlyQueuing}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  )
}

export default OnlineQueue
