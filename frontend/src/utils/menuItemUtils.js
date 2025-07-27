import { CheckCircle, CircleX } from "lucide-react"

export const getItemAction = (item, user, handlers) => {
  const { onToggleActive, onToggleStock } = handlers
  if (user?.role === "owner") {
    return {
      label: item.isAvailable ? "Mark as Unavailable" : "Mark as Available",
      icon: item.isAvailable ? CircleX : CheckCircle,
      to: "#",
      bgColor: item.isAvailable ? "bg-red-500" : "bg-green-500",
      hoverColor: item.isAvailable ? "hover:bg-red-600" : "hover:bg-green-600",
      textColor: "text-white",
      preventNavigation: true,
      expandedWidth: item.isAvailable
        ? "group-hover:w-[180px]"
        : "group-hover:w-[160px]",
      onClick: () => onToggleActive(item),
    }
  }

  if (user?.role === "staff") {
    return {
      label: item.isInStock ? "Set Out of Stock" : "Set In Stock",
      icon: item.isInStock ? CircleX : CheckCircle,
      to: "#",
      bgColor: item.isInStock ? "bg-orange-500" : "bg-emerald-500",
      hoverColor: item.isInStock
        ? "hover:bg-orange-600"
        : "hover:bg-emerald-600",
      textColor: "text-white",
      preventNavigation: true,
      expandedWidth: item.isInStock
        ? "group-hover:w-[160px]"
        : "group-hover:w-[130px]",
      onClick: () => onToggleStock(item),
    }
  }

  return null
}

export default getItemAction