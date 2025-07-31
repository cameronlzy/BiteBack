import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, ShoppingCart } from "lucide-react"
import RestaurantRelatedItemUI from "@/components/common/RestaurantRelatedItemUI"
import { useLocation, useNavigate } from "react-router-dom"
import { deleteMenuItem } from "@/services/menuService"
import { useConfirm } from "../common/ConfirmProvider"
import { ownedByUser } from "@/utils/ownerCheck"
import { toast } from "react-toastify"

const ItemPage = ({
  item,
  restaurant,
  onClose,
  onAddToCart,
  user,
  setMenuItems,
  canOrder,
  onToggleActive,
  onToggleOOS,
  onBack,
}) => {
  const [showForm, setShowForm] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [remarks, setRemarks] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const handleSubmit = () => {
    if (quantity > 0) {
      onAddToCart(item, quantity, remarks)
      onClose()
    } else {
      toast.error("Quantity must be at least 1")
      return
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm(
      `Are you sure you want to delete the menu item "${item.name}"?`
    )

    if (!confirmed) return

    try {
      await deleteMenuItem(item._id)
      setMenuItems((prev) => prev.filter((i) => i._id !== item._id))
      toast.success("Item deleted")
      onClose()
    } catch (ex) {
      toast.error("Failed to delete item")
      throw ex
    }
  }

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity || 1)
      setRemarks(item.remarks || "")
      setShowForm(true)
    }
  }, [item])

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto pt-20 px-4"
        >
          <div className="max-w-2xl w-full">
            <RestaurantRelatedItemUI
              restaurant={restaurant}
              type="item"
              from={location.pathname}
              title={item.name}
              description={item.description}
              image={item.image}
              price={item.price}
              isOwnedByUser={ownedByUser(restaurant, user)}
              isStaff={user?.role === "staff"}
              onToggleOOS={() => onToggleOOS(item)}
              currentlyActive={item?.isAvailable}
              currentlyInStock={item?.isInStock}
              onEdit={() => {
                navigate(`/menu-item/edit/${item.restaurant}/${item._id}`, {
                  state: {
                    from: location.pathname,
                  },
                })
              }}
              onActivate={() => onToggleActive(item)}
              onDelete={handleDelete}
              onBack={onBack}
              activatePhrase="Make Available"
              deactivatePhrase="Mark as Unavailable"
              action={
                user?.role === "customer" &&
                item?.isAvailable &&
                item?.isInStock &&
                canOrder && {
                  onClick: () => setShowForm((prev) => !prev),
                  icon: <ShoppingCart className="w-4 h-4" />,
                  label: showForm ? "Cancel" : "Add to Cart",
                }
              }
              banner={
                !item?.isAvailable ? (
                  <div className="bg-yellow-50 text-yellow-900 border-t-4 border-yellow-400 px-4 py-3 flex items-center justify-between rounded-t-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">
                        Item not available at this time
                      </span>
                    </div>
                  </div>
                ) : !item?.isInStock ? (
                  <div className="bg-yellow-50 text-yellow-900 border-t-4 border-yellow-400 px-4 py-3 flex items-center justify-between rounded-t-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">
                        Item out of stock at this time
                      </span>
                    </div>
                  </div>
                ) : null
              }
              form={
                showForm &&
                user?.role === "customer" &&
                item?.isAvailable &&
                item?.isInStock &&
                canOrder && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={quantity}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault()
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "") {
                            setQuantity("")
                            return
                          }
                          if (/^\d+$/.test(val)) {
                            setQuantity(Number(val))
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Remarks
                      </label>
                      <Input
                        type="text"
                        value={remarks || ""}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value.length <= 500) {
                            setRemarks(value)
                          }
                        }}
                        placeholder="Optional special instructions"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {remarks?.length || 0}/500 characters
                      </p>
                    </div>

                    <Button onClick={handleSubmit} className="w-full">
                      Confirm Add to Cart
                    </Button>
                  </div>
                )
              }
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ItemPage
