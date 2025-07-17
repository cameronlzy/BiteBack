import { Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"

const OrderItemSummary = ({
  name,
  quantity,
  remarks,
  price,
  canEdit,
  onEdit,
  onDelete,
}) => {
  const totalPrice = price * quantity

  return (
    <div className="flex justify-between items-center border rounded-lg px-4 py-2">
      <div className="flex flex-col items-start">
        <span className="font-medium">
          {name} × {quantity} (${totalPrice.toFixed(2)} total)
        </span>
        {remarks && (
          <span className="text-sm text-muted-foreground">{remarks}</span>
        )}
      </div>
      {canEdit && (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default OrderItemSummary
