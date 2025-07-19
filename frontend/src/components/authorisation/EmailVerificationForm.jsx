import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { maskEmail } from "@/utils/stringRegexUtils"
import { useNavigate, useParams } from "react-router-dom"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { verifyEmail } from "@/services/authService"
import { toast } from "react-toastify"

const EmailVerificationForm = ({ onSubmit, email: providedEmail }) => {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [loading, setLoading] = useState(false)
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const verification = async () => {
      try {
        await verifyEmail(token)
        localStorage.setItem("toastMessage", "Account Verified!")
        window.location = "/"
      } catch (ex) {
        toast.error("Verification Token Invalid")
        navigate("/register", { replace: true })
        throw ex
      }
    }
    if (token?.trim()) {
      verification()
    }
  }, [token])

  const getTargetEmail = () =>
    typeof providedEmail === "string" && !!providedEmail.trim()
      ? providedEmail
      : email.trim()

  const handleVerify = async () => {
    const targetEmail = getTargetEmail()
    if (!targetEmail) {
      setEmailError("Email is required")
      return
    }

    try {
      setLoading(true)
      setEmailError("")
      await onSubmit(targetEmail)
    } catch (ex) {
      console.log(ex)
      setEmailError("Verification failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!onSubmit && !providedEmail && token.trim()) {
    return (
      <div className="flex justify-center items-center py-10">
        <LoadingSpinner />
        <span className="ml-2 text-sm text-gray-600">Verifying Email...</span>
      </div>
    )
  }

  return (
    <div className="max-w-sm w-full mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Resend Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            {providedEmail ? (
              <Input
                value={maskEmail(providedEmail)}
                readOnly
                className="bg-muted"
              />
            ) : (
              <>
                <Input
                  value={email}
                  onChange={(e) => {
                    console.log(email)
                    setEmail(e.target.value)
                  }}
                  placeholder="Enter your registered email"
                />
                {emailError && (
                  <p className="text-sm text-red-500 mt-1">{emailError}</p>
                )}
              </>
            )}
            <p className="text-muted-foreground">
              Please check your email for the verification link
            </p>
          </div>
          <Button
            type="button"
            onClick={handleVerify}
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner inline={true} size="sm" /> Sending...
              </>
            ) : (
              "Resend Email Verification"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmailVerificationForm
