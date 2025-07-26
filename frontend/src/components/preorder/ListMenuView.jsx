import { getCardMessageFromDescription } from "@/utils/stringRegexUtils"
import RoundedActionButton from "../common/RoundedActionButton"
import { Button } from "@/components/ui/button"
import getItemAction from "@/utils/menuItemUtils"

const ListMenuView = ({
  items = [],
  handleItemSelect,
  onToggleActive,
  onToggleStock,
  user,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const disabled = !item.isAvailable || !item.isInStock
        const disabledMessage = !item.isAvailable
          ? "Item Currently Unavailable"
          : !item.isInStock
          ? "Item Currently Out of Stock"
          : ""
        const action = getItemAction(item, user, {
          onToggleActive,
          onToggleStock,
        })

        return (
          <div
            key={item._id}
            className="flex items-start text-left justify-between border border-muted rounded-md px-4 py-3"
          >
            <div className="flex flex-col flex-1 items-start pr-4">
              <Button
                variant="link"
                onClick={() => handleItemSelect(item)}
                className="p-0 h-auto text-lg font-semibold text-left text-blue-600 disabled:text-gray-400"
              >
                {item.name}
              </Button>
              <span className="text-sm text-muted-foreground">
                {getCardMessageFromDescription(item.description)}
              </span>
              <span className="text-sm font-medium mt-1">
                ${item.price.toFixed(2)}
              </span>
              {disabled && (
                <span className="text-xs text-red-500 font-medium mt-1">
                  {disabledMessage}
                </span>
              )}
            </div>

            {action && (
              <div className="flex-shrink-0">
                <RoundedActionButton
                  icon={action.icon}
                  label={action.label}
                  bgColor={action.bgColor}
                  hoverColor={action.hoverColor}
                  textColor={action.textColor}
                  disabled={action.disabled}
                  preventNavigation={action.preventNavigation}
                  onClick={action.onClick}
                  expandedWidth={action.expandedWidth}
                  showOnlyOnHover={true}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ListMenuView
