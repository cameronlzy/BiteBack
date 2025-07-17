import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import RestaurantMenuSection from "./RestaurantMenuSection"
import { menuCategoryList } from "@/utils/schemas"
import { PlusCircle, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  getRestaurant,
  togglePreordersEnabled,
} from "@/services/restaurantService"
import { toast } from "react-toastify"
import ItemPage from "./ItemPage"
import OrderConfirmationPage from "./OrderConfirmationPage"
import { getMenuByRestaurant } from "@/services/menuService"
import { ownedByUser, userIsOwner } from "@/utils/ownerCheck"
import BackButton from "../common/BackButton"
import { saveOrder } from "@/services/orderService"
import PreviousOrderBar from "./PreviousOrderBar"

const RestaurantMenu = ({ user }) => {
  const [menuItems, setMenuItems] = useState([])
  const [currentItemShown, setCurrentItemShown] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [editingOrder, setEditingOrder] = useState(false)
  const [originalOrderItems, setOriginalOrderItems] = useState([])
  const [currentlyInQueue, setCurrentlyInQueue] = useState(false)
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [orderItems, setOrderItems] = useState(
    JSON.parse(localStorage.getItem("order_items")) || []
  )

  const isOwnedByUser = ownedByUser(restaurant, user)
  const from = location.state?.from
    ? location.state.from
    : userIsOwner(user)
    ? "/restaurants"
    : `/online-queue/${restaurantId}`
  const existingOrder = location.state?.existingOrder

  useEffect(() => {
    if (existingOrder) {
      const normalised = existingOrder?.items?.map((item) => ({
        existingOrderLineId: item._id,
        _id: item.item,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        remarks: item.remarks,
      }))

      localStorage.setItem("order_items", JSON.stringify(normalised))
      setOrderItems(normalised)
      setOriginalOrderItems(normalised)
      setEditingOrder(true)
    }
  }, [existingOrder])

  useEffect(() => {
    if (user?.role === "customer") {
      const inQueue = localStorage.getItem("currentQueue") === restaurantId
      const preorderDisabled = restaurant?.preordersEnabled === false
      setCurrentlyInQueue(inQueue)
      if (preorderDisabled) {
        toast.error("Pre-ordering is currently disabled by the restaurant", {
          toastId: "preorder-disabled",
        })
        navigate("/restaurants", { replace: true })
      }
    }
  }, [user, restaurantId, location, restaurant?.preordersEnabled])

  useEffect(() => {
    const fetchRestaurantAndMenu = async () => {
      try {
        const res = await getRestaurant(restaurantId)
        setRestaurant(res)
        const menu = await getMenuByRestaurant(restaurantId)
        console.log(menu)
        setMenuItems(menu)
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Restaurant Not Found", {
            toastId: "invalid-rest-id",
          })
          navigate("/not-found", {
            replace: true,
          })
        } else {
          toast.error("Failed to fetch restaurant")
          throw ex
        }
      }
    }

    fetchRestaurantAndMenu()
  }, [restaurantId])

  const menuByCategory = useMemo(() => {
    const grouped = {}
    for (const { value } of menuCategoryList) {
      grouped[value] = []
    }
    for (const item of menuItems) {
      if (grouped[item.category]) {
        grouped[item.category].push(item)
      }
    }
    return grouped
  }, [menuItems])

  const handleCreateMenuItem = () => {
    navigate(`/menu-item/new/${restaurantId}`, {
      replace: true,
      state: {
        from: location.pathname,
      },
    })
  }

  const handleAddToCart = (item, quantity = 1, remarks = "") => {
    const normalisedRemarks = remarks.toLowerCase()
    const existing = JSON.parse(localStorage.getItem("order_items") || "[]")

    const existingIndex = existing.findIndex(
      (i) =>
        i._id === item._id &&
        (i.remarks || "").toLowerCase() === normalisedRemarks
    )

    if (existingIndex !== -1) {
      existing[existingIndex].quantity += quantity
    } else {
      existing.push({
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity,
        remarks,
        ...(item.existingOrderLineId && {
          existingOrderLineId: item.existingOrderLineId,
        }),
      })
    }
    console.log(existing)

    localStorage.setItem("order_items", JSON.stringify(existing))
    setOrderItems(existing)
  }

  const handleSubmitOrder = async () => {
    const cleanedOrderItems = orderItems.map((item) => {
      const cleaned = { ...item }
      if (!item.remarks || item.remarks.trim() === "") {
        delete cleaned.remarks
      }
      return cleaned
    })
    try {
      if (editingOrder) {
        const orderId = localStorage.getItem("order_id")

        const update = cleanedOrderItems.filter((item) => {
          const original = originalOrderItems.find(
            (o) => o.existingOrderLineId === item?.existingOrderLineId
          )
          return (
            original &&
            (original.quantity !== item.quantity ||
              (original.remarks || "") !== (item.remarks || ""))
          )
        })

        const updateIds = update.map((u) => u.existingOrderLineId)

        const add = cleanedOrderItems
          .filter((item) => {
            const isInOriginal = originalOrderItems.some(
              (o) => o.existingOrderLineId === item?.existingOrderLineId
            )
            return !isInOriginal
          })
          .map(({ _id, quantity, remarks }) => {
            const obj = { item: _id, quantity }
            if (remarks) obj.remarks = remarks
            return obj
          })

        const remove = originalOrderItems
          .filter(
            (orig) =>
              !cleanedOrderItems.some(
                (curr) => curr?.existingOrderLineId === orig.existingOrderLineId
              ) && !updateIds.includes(orig.existingOrderLineId)
          )
          .map((i) => i.existingOrderLineId)

        const mappedUpdate = update.map((item) => {
          const original = originalOrderItems.find(
            (o) => o.existingOrderLineId === item?.existingOrderLineId
          )

          const updateItem = {
            _id: item.existingOrderLineId,
          }

          if (original.quantity !== item.quantity) {
            updateItem.quantity = item.quantity
          }

          if ((original.remarks || "") !== (item.remarks || "")) {
            updateItem.remarks = item.remarks
          }

          return updateItem
        })

        const payload = { _id: orderId }
        if (add.length > 0) payload.add = add
        if (update.length > 0) payload.update = mappedUpdate
        if (remove.length > 0) payload.remove = remove
        if (!payload.add && !payload.update && !payload.remove) {
          toast.info("No changes made to the order")
          return navigate(from, { replace: true })
        }

        await saveOrder(payload)
        toast.success("Order updated")
      } else {
        const payload = {
          type: "preorder",
          restaurant: restaurantId,
          items: cleanedOrderItems.map(({ _id, quantity, remarks }) => ({
            item: _id,
            quantity,
            remarks,
          })),
        }
        const order = await saveOrder(payload)
        localStorage.setItem("order_id", order._id)
        window.dispatchEvent(new Event("order_id_change"))
        toast.success("Order submitted successfully")
      }

      setOrderItems([])
      localStorage.removeItem("order_items")
      navigate(from, { replace: true })
    } catch (ex) {
      toast.error("Failed to submit order")
      console.log(ex)
      throw ex
    }
  }

  const handleDeleteItem = (_id, remarks = "") => {
    const normalizedRemarks = remarks.toLowerCase()
    const updated = orderItems.filter(
      (item) =>
        !(
          item._id === _id &&
          (item.remarks || "").toLowerCase() === normalizedRemarks
        )
    )
    localStorage.setItem("order_items", JSON.stringify(updated))
    setOrderItems(updated)
  }

  const handleEditItem = (orderItem) => {
    const fullItem = menuItems.find((m) => m._id === orderItem._id)
    if (!fullItem) return

    const existing = JSON.parse(localStorage.getItem("order_items") || "[]")
    const updated = existing.filter(
      (i) =>
        !(
          i._id === orderItem._id &&
          (i.remarks || "").toLowerCase() ===
            (orderItem.remarks || "").toLowerCase()
        )
    )
    setOrderItems(updated)
    localStorage.setItem("order_items", JSON.stringify(updated))

    setCurrentItemShown({
      ...fullItem,
      quantity: orderItem.quantity,
      remarks: orderItem.remarks,
      _id: orderItem._id,
      ...(orderItem.existingOrderLineId && {
        existingOrderLineId: orderItem.existingOrderLineId,
      }),
    })

    setShowConfirm(false)
  }

  const handleTogglePreorder = async () => {
    try {
      const updated = await togglePreordersEnabled(
        restaurantId,
        !restaurant.preordersEnabled
      )
      setRestaurant((prev) => ({
        ...prev,
        ...updated,
      }))
      toast.success(
        updated.preordersEnabled ? "Pre-order enabled" : "Pre-order disabled"
      )
    } catch (ex) {
      toast.error("Failed to toggle pre-order")
      console.error(ex)
    }
  }

  const handleItemSelect = (item) => {
    setCurrentItemShown(item)
    setShowConfirm(false)
  }

  const handleShowConfirm = () => {
    setCurrentItemShown(null)
    setShowConfirm(true)
  }

  return (
    <div className="w-full space-y-6">
      <BackButton from={from} />
      <div className="px-2 space-y-2">
        <h2 className="text-2xl font-bold text-center">
          {restaurant?.name} Menu
        </h2>
        {!existingOrder && (
          <PreviousOrderBar
            customerId={user._id}
            restaurantId={restaurantId}
            currentlyInQueue={currentlyInQueue}
            setOrderItems={(items) => {
              setOrderItems(items)
              localStorage.setItem("order_items", JSON.stringify(items))
            }}
          />
        )}

        <div className="flex justify-end">
          {user.role === "customer" && currentlyInQueue ? (
            <Button size="sm" variant="ghost" onClick={handleShowConfirm}>
              <ShoppingCart className="w-5 h-5" />
            </Button>
          ) : isOwnedByUser ? (
            <div className="flex flex-col items-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCreateMenuItem}
                className="flex items-center gap-1"
              >
                <PlusCircle className="w-5 h-5" />
                Add Menu Item
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTogglePreorder}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="w-5 h-5" />
                {restaurant?.preordersEnabled
                  ? "Disable Pre-Order Access"
                  : "Enable Pre-Order Access"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue={menuCategoryList[0]?.value} className="w-full">
        <div className="flex justify-center">
          <TabsList className="flex flex-wrap gap-2">
            {menuCategoryList
              .filter(({ value }) => (menuByCategory[value] || []).length > 0)
              .map(({ value, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="whitespace-nowrap"
                >
                  {label}
                </TabsTrigger>
              ))}
          </TabsList>
        </div>

        {menuCategoryList
          .filter(({ value }) => (menuByCategory[value] || []).length > 0)
          .map(({ value }) => (
            <TabsContent key={value} value={value} className="mt-4">
              <RestaurantMenuSection
                category={value}
                items={menuByCategory[value] || []}
                handleItemSelect={handleItemSelect}
              />
            </TabsContent>
          ))}
      </Tabs>

      <ItemPage
        currentlyInQueue={currentlyInQueue}
        item={currentItemShown}
        restaurant={restaurant}
        onClose={() => setCurrentItemShown(null)}
        onAddToCart={handleAddToCart}
        user={user}
        setMenuItems={setMenuItems}
        setCurrentItemShown={setCurrentItemShown}
      />
      {user.role === "customer" && currentlyInQueue && (
        <OrderConfirmationPage
          showConfirm={showConfirm}
          onClose={() => setShowConfirm(false)}
          orderItems={orderItems.map((item) => ({
            ...item,
            canEdit: true,
            onEdit: () => handleEditItem(item),
            onDelete: () => handleDeleteItem(item._id, item.remarks),
          }))}
          restaurantId={restaurantId}
          onSubmit={handleSubmitOrder}
          user={user}
          isExisting={Array.isArray(existingOrder?.items)}
          setShowConfirm={setShowConfirm}
        />
      )}
    </div>
  )
}

export default RestaurantMenu
