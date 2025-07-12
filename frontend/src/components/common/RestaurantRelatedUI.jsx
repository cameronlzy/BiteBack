import { motion, AnimatePresence } from "framer-motion"
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
  action = null,
  form = null,
}) => {
  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 relative">
      <BackButton from={from} />
      {banner && <div className="mt-4 translate-y-2">{banner}</div>}

      <Card className="mt-0 shadow-xl border relative">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <Link to={`/restaurants/${restaurant._id}`} state={{ from }}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
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
                    {onActivate && (
                      <DropdownMenuItem
                        className="hover:bg-gray-100 text-gray-800"
                        onClick={onActivate}
                      >
                        {type === "Event"
                          ? currentlyActive
                            ? "Cancel"
                            : "Re-Open"
                          : currentlyActive
                          ? "Deactivate"
                          : "Activate"}{" "}
                        {type}
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

          {action && (
            <Button
              variant="outline"
              size="lg"
              className="mt-4"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          )}

          <AnimatePresence>
            {form && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mt-4">{form}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}

export default RestaurantRelatedItemUI
