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
  expandedWidth = "w-[140px]",
}) => {
  const location = useLocation()

  const widthMap = {
    "w-[100px]": "group-hover:w-[100px]",
    "w-[110px]": "group-hover:w-[110px]",
    "w-[120px]": "group-hover:w-[120px]",
    "w-[140px]": "group-hover:w-[140px]",
  }

  const widthClass = widthMap[expandedWidth] || "group-hover:w-[140px]"
  return (
    <Link
      to={to}
      state={{ from: location.pathname }}
      className="group"
      onClick={(e) => {
        if (preventNavigation) e.preventDefault()
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
        <Icon className="w-5 h-5" />
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
