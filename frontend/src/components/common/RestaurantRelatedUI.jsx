import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu"
import { ArrowRight, Settings } from "lucide-react"
import { Link } from "react-router-dom"
import BackButton from "@/components/common/BackButton"

const RestaurantRelatedItemUI = ({
  type,
  restaurant,
  from,
  title,
  icon,
  image = null,
  bgColour,
  description,
  metaContent,
  isOwnedByUser,
  onEdit,
  onDelete,
  onActivate = null,
  currentlyActive = null,
  banner = null,
  onClick = null,
}) => {
  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 relative">
      <BackButton from={from} />

      {banner && <div className="mt-4">{banner}</div>}

      <Card className="mt-4 shadow-xl border relative">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <Link to={`/restaurants/${restaurant._id}`} state={{ from }}>
            <Button variant="outline" size="sm">
              To {restaurant.name || "Restaurant"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="relative">
            {image ? (
              <img
                src={image}
                alt="Main"
                className="w-full rounded-md object-cover border"
              />
            ) : (
              <div className="flex items-center justify-center p-6">
                <div
                  className={`${
                    bgColour || "bg-gray-100"
                  } rounded-full p-6 border`}
                >
                  {icon}
                </div>
              </div>
            )}

            {isOwnedByUser && (onEdit || onDelete || onActivate) && (
              <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-40 bg-white shadow-md rounded-md"
                  >
                    {onEdit && (
                      <DropdownMenuItem
                        className="hover:bg-gray-100 text-gray-800"
                        onClick={onEdit}
                      >
                        Edit {type}
                      </DropdownMenuItem>
                    )}
                    {onActivate && type === "Promotion" && (
                      <DropdownMenuItem
                        className="hover:bg-gray-100 text-gray-800"
                        onClick={onActivate}
                      >
                        {currentlyActive ? "Deactivate " : "Activate "} {type}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={onDelete}
                        className="text-red-600 hover:bg-red-50 focus:bg-red-100 focus:text-red-700 font-medium"
                      >
                        Delete {type}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <p className="text-gray-700 text-base font-semibold whitespace-pre-line">
            {description}
          </p>

          <div className="text-sm text-gray-600 space-y-1">{metaContent}</div>

          {onClick && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onClick.onClick}
            >
              {onClick.icon}
              <span className="ml-2">{onClick.label}</span>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default RestaurantRelatedItemUI
