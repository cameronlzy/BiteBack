import { Button } from "@/components/ui/button"

const ConfirmationPage = ({ formName = "Details", details, isSubmitting }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold">Confirm Details</h3>
      <ul className="text-gray-700 space-y-1">
        {Object.entries(details).map(([name, value]) => (
          <li key={name}>
            <b>{name}:</b> {String(value)}
          </li>
        ))}
      </ul>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Confirm {formName ? formName : "Submission"}
      </Button>
    </div>
  )
}

export default ConfirmationPage
