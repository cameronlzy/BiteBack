import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { maskEmail } from "@/utils/stringRegexUtils"
import { useNavigate, useSearchParams } from "react-router-dom"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { verifyEmail } from "@/services/authService"
import { toast } from "react-toastify"

const EmailVerificationForm = ({ onSubmit, email: providedEmail }) => {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  useEffect(() => {
    const verification = async () => {
      try {
        localStorage.setItem("TokenToCheck", token)
        await verifyEmail(token)
        localStorage.setItem("toastMessage", "Account Verified!")
        window.location = "/login"
      } catch (ex) {
        toast.error("Verification Token Invalid", {
          toastId: "verification-email-fail",
        })
        navigate("/register", { replace: true })
        throw ex
      } finally {
        localStorage.removeItem("mid-registration")
      }
    }
    if (token) {
      const data = verification()
      console.log(data)
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
      setTimer(30)
    } catch (ex) {
      console.log(ex)
      setEmailError("Verification failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!onSubmit && !providedEmail && token?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2">
        <div className="flex items-center">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-gray-600">Verifying Email...</span>
        </div>
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
                  onChange={(e) => setEmail(e.target.value)}
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
            disabled={loading || timer > 0}
          >
            {loading ? (
              <>
                <LoadingSpinner inline={true} size="sm" /> Sending...
              </>
            ) : timer > 0 ? (
              `Resend available in ${timer}s`
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
