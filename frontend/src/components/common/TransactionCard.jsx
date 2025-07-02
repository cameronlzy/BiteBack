import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

const TransactionCard = ({
  _id,
  name,
  price,
  currencyType,
  iconComponent,
  image,
  date,
  cardMessage,
  clickMessage,
  onClick,
}) => {
  return (
    <Card key={_id} className="mb-4 shadow">
      {currencyType === "points" && iconComponent ? (
        <div className="flex justify-center items-center bg-gray-50 py-6 rounded-t-xl">
          {iconComponent}
        </div>
      ) : image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-40 object-cover rounded-t-xl"
        />
      ) : null}

      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg">
          <span>{name}</span>
          <span className="text-sm text-muted-foreground">
            {currencyType === "points" ? `${price} pts` : `$${price}`}
          </span>
        </CardTitle>

        {cardMessage && (
          <p className="text-sm text-muted-foreground mt-1">{cardMessage}</p>
        )}

        {date && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {date}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <Button variant="ghost" onClick={onClick} className="w-full">
          {clickMessage}
        </Button>
      </CardContent>
    </Card>
  )
}

export default TransactionCard
