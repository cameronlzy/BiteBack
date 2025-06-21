import SubmitButton from "./SubmitButton"

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
      <SubmitButton
        type="submit"
        className="w-full"
        condition={isSubmitting}
        normalText={`Confirm ${formName ? formName : "Submission"}`}
      />
    </div>
  )
}

export default ConfirmationPage
