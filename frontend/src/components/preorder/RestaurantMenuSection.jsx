import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import TransactionCard from "../common/TransactionCard"

const RestaurantMenuSection = ({ items = [], handleItemSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <TransactionCard
          key={item._id}
          _id={item._id}
          name={item.name}
          description={getCardMessageFromDescription(item.description)}
          price={item.price}
          currencyType="money"
          image={item?.image}
          disabled={!item.isAvailable || !item.isInStock}
          disabledMessage={
            !item.isAvailable
              ? "Item Currently Unavailable"
              : !item.isInStock
              ? "Item Currently Out of Stock"
              : ""
          }
          onClick={() => handleItemSelect(item)}
          clickMessage="View Item Details"
        />
      ))}
    </div>
  )
}

export default RestaurantMenuSection
