import { Button } from "@/components/ui/button"
import LoadingSpinner from "./LoadingSpinner"

const SubmitButton = ({
  type = "submit",
  onClick,
  condition,
  size = "sm",
  className = "",
  loadingText = "Submitting...",
  normalText = "Submit",
  disabled,
}) => {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={condition || disabled}
      size={size}
      className={className}
    >
      {condition ? (
        <>
          <LoadingSpinner size="sm" inline={true} /> {loadingText}
        </>
      ) : (
        normalText
      )}
    </Button>
  )
}

export default SubmitButton
