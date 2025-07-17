import { useForm, FormProvider } from "react-hook-form"
import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { itemSchema } from "@/utils/schemas"
import {
  getMenuItem,
  uploadMenuItemImage,
  updateMenuItemImage,
  saveMenuItem,
  deleteMenuItem,
} from "@/services/menuService"
import ImageUpload from "@/components/common/ImageUpload"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { getRestaurant } from "@/services/restaurantService"
import { ownedByUser } from "@/utils/ownerCheck"
import BackButton from "@/components/common/BackButton"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { menuCategoryList } from "@/utils/schemas"
import LoadingSpinner from "../common/LoadingSpinner"
import { objectComparator } from "@/utils/objectComparator"

const MenuItemForm = ({ user }) => {
  const { restaurantId, itemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/"
  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [originalItem, setOriginalItem] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])

  const form = useForm({
    resolver: safeJoiResolver(itemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      restaurant: restaurantId,
    },
    mode: "onSubmit",
  })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getRestaurant(restaurantId)

        if (!res || (user?.role !== "owner" && !ownedByUser(res, user))) {
          toast.error("Unauthorised to edit this restaurant menu.", {
            toastId: "unauthorised-menu-item-creation",
          })
          navigate(from, { replace: true })
          return
        }

        setRestaurant(res)

        if (itemId) {
          const item = await getMenuItem(itemId)
          setOriginalItem(item)

          form.reset({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            restaurant: restaurantId,
          })

          if (item.image) {
            setSelectedFiles([item.image])
          }
        }
      } catch (ex) {
        if (ex.response?.status === 404 || ex.response?.status === 400) {
          toast.error("Restaurant Not Found", { toastId: "not-found" })
          navigate("/not-found", { replace: true })
        } else {
          toast.error("Failed to load data")
          throw ex
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [restaurantId, itemId, user])

  const onSubmit = async (data) => {
    const hasNewImage = selectedFiles[0] instanceof File

    if (!selectedFiles[0]) {
      toast.error("Image is required")
      return
    }

    try {
      let payload = { ...data, _id: itemId }
      let savedItem = null

      if (itemId && originalItem) {
        const changes = objectComparator(originalItem, payload)
        const noChanges = Object.keys(changes).length === 0 && !hasNewImage

        if (noChanges) {
          toast.info("No changes made")
          navigate(`/restaurants/${restaurantId}`, { replace: true })
          return
        }

        if (Object.keys(changes).length > 0) {
          payload = { ...changes, _id: itemId }
          savedItem = await saveMenuItem(payload)
        } else {
          savedItem = originalItem
        }
      } else {
        savedItem = await saveMenuItem(payload)
      }

      if (hasNewImage) {
        try {
          if (itemId) {
            await updateMenuItemImage(savedItem._id, selectedFiles[0])
          } else {
            await uploadMenuItemImage(savedItem._id, selectedFiles[0])
          }
        } catch {
          if (!itemId) {
            await deleteMenuItem(savedItem._id)
            toast.error("Image upload failed. Item was not saved.")
            return
          } else if (
            originalItem &&
            Object.keys(objectComparator(originalItem, payload)).length > 0
          ) {
            await saveMenuItem({ ...originalItem, _id: savedItem._id })
            toast.error("Image upload failed. Changes were reverted.")
            return
          } else {
            toast.error("Image upload failed. Item saved without image.")
          }
        }
      }

      toast.success(itemId ? "Item updated" : "Item added")
      navigate(`/pre-order/${restaurantId}`)
    } catch (ex) {
      toast.error("Submission failed")
      throw ex
    }
  }

  if (loading || !restaurant) return <LoadingSpinner />

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BackButton from={from} />
        <h1 className="text-2xl font-bold mb-4">
          {itemId
            ? `Edit Menu Item for ${restaurant.name}`
            : `Add Menu Item for ${restaurant.name}`}
        </h1>

        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Item Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  pattern="^\d+(\.\d{0,2})?$"
                  inputMode="decimal"
                  placeholder="Price"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {menuCategoryList.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          maxFiles={1}
          title="Item Image"
          firstRequired
          index={0}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? "Saving..."
            : itemId
            ? "Update Item"
            : "Save Item"}
        </Button>
      </form>
    </FormProvider>
  )
}

export default MenuItemForm
