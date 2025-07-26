import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import OrderItemSummary from "./OrderItemSummary"

const OrderDisplay = ({
  orderItems,
  handlePreOrderNavigate,
  restaurant,
  isStaff = false,
  code = null,
}) => {
  return (
    <Card className="shadow-xl border border-muted-foreground/10">
      <CardHeader className="pb-2 border-b flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">
          {isStaff ? "Customer Order" : "Current Order"}
        </CardTitle>
        {code && (
          <span className="text-sm text-muted-foreground">
            Order Code: <strong>{code}</strong>
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {orderItems.length > 0 ? (
          orderItems.map((item, index) => (
            <OrderItemSummary key={index} {...item} canEdit={false} />
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No Existing Order</p>
        )}
      </CardContent>
      <CardFooter className="pt-4 flex flex-col space-y-2">
        <div className="w-full flex justify-between text-base font-medium mb-4">
          <span>Total</span>
          <span>
            $
            {orderItems
              .reduce((sum, item) => sum + item.price * item.quantity, 0)
              .toFixed(2)}
          </span>
        </div>
        {restaurant?.preordersEnabled && !isStaff && (
          <Button
            variant="outline"
            onClick={handlePreOrderNavigate}
            className="w-full"
          >
            Edit order
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default OrderDisplay
