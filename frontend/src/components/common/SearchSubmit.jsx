import { Button } from "@/components/ui/button"
import LoadingSpinner from "../common/LoadingSpinner"

const SearchSubmit = ({
  type = "submit",
  onClick,
  condition,
  size = "sm",
  className = "",
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={condition}
      size={size}
      className={className}
    >
      {condition ? (
        <>
          <LoadingSpinner size="sm" inline={true} /> Searching...
        </>
      ) : (
        "Search"
      )}
    </Button>
  )
}

export default SearchSubmit
