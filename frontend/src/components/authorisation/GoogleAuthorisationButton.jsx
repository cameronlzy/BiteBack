import { Button } from "@/components/ui/button"

const GoogleAuthorisationButton = ({ onClick, padding }) => {
  return (
    <Button
      onClick={onClick}
      className={`${padding} w-full flex items-center justify-center gap-2 bg-white border hover:bg-gray-50 text-black`}
    >
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo"
        className="w-5 h-5"
      />
      Continue with Google
    </Button>
  )
}

export default GoogleAuthorisationButton
