import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

const RoundedActionButton = ({
  to,
  icon: Icon,
  label,
  bgColor,
  hoverColor,
  textColor = "text-white",
  disabled = false,
  showOnlyOnHover = true,
  preventNavigation = false,
  expandedWidth,
  onClick,
}) => {
  const location = useLocation()

  const toGroupHoverWidth = (width, label) => {
    if (typeof width !== "string") return ""

    return label === "View Rewards"
      ? "group-hover:w-[150px]"
      : label === "View Member Events"
      ? "group-hover:w-[190px]"
      : `group-hover:${width}`
  }

  const widthClass = expandedWidth
    ? toGroupHoverWidth(expandedWidth, label)
    : "group-hover:w-[150px]"
  return (
    <Link
      to={to}
      state={{ from: location.pathname }}
      className="group"
      onClick={(e) => {
        if (preventNavigation) e.preventDefault()
        if (onClick) onClick(e)
      }}
    >
      <Button
        disabled={disabled}
        className={`h-11 px-3 w-11 transition-[width] duration-300 ease-in-out
  ${widthClass}
  rounded-full overflow-hidden shadow flex items-center justify-start gap-2
  ${bgColor} ${hoverColor} ${textColor}
  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
`}
      >
        <Icon className="w-5 h-5 ml-0.5" />
        <span
          className={`${
            showOnlyOnHover ? "opacity-0 group-hover:opacity-100" : ""
          } transition-opacity duration-300 whitespace-nowrap`}
        >
          {label}
        </span>
      </Button>
    </Link>
  )
}

export default RoundedActionButton
