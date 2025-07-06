import {
  TicketPercent,
  CircleDollarSign,
  Gift,
  ShoppingBag,
} from "lucide-react"

export const iconMap = {
  percentage: { icon: TicketPercent, colour: "text-rose-500", bgColour: "bg-rose-100" },
  monetary: { icon: CircleDollarSign, colour: "text-yellow-600", bgColour: "bg-yellow-100" },
  freeItem: { icon: Gift, colour: "text-green-600", bgColour: "bg-green-100" },
  buyXgetY: { icon: ShoppingBag, colour: "text-blue-500", bgColour: "bg-sky-100" },
}

export const categoryOptions = [
    { label: "Discount %", value: "percentage" },
    { label: "Monetary Value", value: "monetary" },
    { label: "Free Item", value: "freeItem" },
    { label: "Buy X Get Y", value: "buyXgetY" },
  ]