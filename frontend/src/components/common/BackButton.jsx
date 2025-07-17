import { useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const BackButton = ({ from, confirming, setConfirming }) => {
  const navigate = useNavigate()
  return (
    <Button
      type="button"
      variant="ghost"
      className="p-0 text-sm mb-2 text-gray-600 hover:text-black flex items-center gap-2"
      onClick={() =>
        confirming
          ? setConfirming(false)
          : navigate(from, {
              replace: true,
            })
      }
    >
      <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
      Back
    </Button>
  )
}

export default BackButton
