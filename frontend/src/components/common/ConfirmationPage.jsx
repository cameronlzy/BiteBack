import { Calendar, User, MapPin, MessageSquare } from "lucide-react"
import SubmitButton from "./SubmitButton"

const iconMap = {
  "Restaurant Name": <MapPin className="w-4 h-4 text-gray-500" />,
  "Reservation Date": <Calendar className="w-4 h-4 text-gray-500" />,
  Guests: <User className="w-4 h-4 text-gray-500" />,
  Remarks: <MessageSquare className="w-4 h-4 text-gray-500" />,
}

const ConfirmationPage = ({ formName = "Details", details, isSubmitting }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Confirm Details</h3>
      <div className="space-y-2 text-gray-700 text-center">
        {Object.entries(details).map(([label, value]) => (
          <div key={label} className="flex items-center gap-2 justify-center">
            {iconMap[label] || null}
            {label === "Remarks" && value === "-" ? (
              <span className="italic text-gray-500">No Remarks</span>
            ) : (
              <span>
                {formName === "Reservation" ? value : `${label}: ${value}`}
              </span>
            )}
          </div>
        ))}
      </div>
      <SubmitButton
        type="submit"
        className="w-full"
        condition={isSubmitting}
        normalText={`Confirm ${formName}`}
      />
    </div>
  )
}

export default ConfirmationPage
