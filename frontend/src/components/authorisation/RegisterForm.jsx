import { useEffect, useState } from "react"
import CustomerForm from "@/components/authorisation/CustomerForm"
import OwnerForm from "@/components/authorisation/OwnerForm"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  updateOwner,
  updateCustomer,
  registerOwner,
  registerCust,
} from "@/services/userService"
import BackButton from "../common/BackButton"
import { useLocation, useNavigate } from "react-router-dom"
import { objectComparator } from "@/utils/objectComparator"
import { register, resendVerificationEmail } from "@/services/authService"
import EmailVerificationForm from "./EmailVerificationForm"
import { toast } from "react-toastify"

const RegisterForm = ({ user, isLoading }) => {
  const [role, setRole] = useState(user?.role || "customer")
  const [isUpdate, setIsUpdate] = useState(false)
  const [needsToVerify, setNeedsToVerify] = useState(false)
  const [email, setEmail] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/"
  useEffect(() => {
    if (user && location.pathname === "/register") {
      navigate("/me/edit", { replace: true })
    }
  }, [user, location.pathname, navigate])

  useEffect(() => {
    if (user) {
      setIsUpdate(true)
    }
  }, [])

  const resendVerification = async (email) => {
    try {
      await resendVerificationEmail(email)
      toast.success("Email has been sent to Registered Email")
    } catch (ex) {
      if (ex.response?.status === 404 || ex.response?.status === 400) {
        toast.error("No Previous Response recorded", {
          toastId: "verification-not-found",
        })
      } else {
        toast.error("Error sending email", {
          toastId: "email-error",
        })
      }
    }
  }

  const handleRegister = async (userToSubmit) => {
    if (
      userToSubmit.role === "owner" &&
      Array.isArray(userToSubmit.restaurants)
    ) {
      delete userToSubmit.restaurants
    }

    const cleanedUser = Object.fromEntries(
      Object.entries(userToSubmit).filter(([_key, value]) => value !== "")
    )

    const finalData = user ? { ...cleanedUser, _id: user._id } : cleanedUser
    const result = objectComparator(user, finalData)

    if (user && Object.keys(result).length === 0) {
      return
    }

    let response = null

    if (!user) {
      const registrationPackage = {
        email: finalData.email,
        username: finalData.username,
        password: finalData.password,
        role: finalData.role,
      }
      const regResponse = await register(registrationPackage)
      if (finalData.role === "owner") {
        const ownerRegResponse = await registerOwner({
          username: finalData.username,
          companyName: finalData.companyName,
        })
        response = { ...regResponse, ...ownerRegResponse }
      } else if (finalData.role === "customer") {
        const customerRegResponse = await registerCust({
          username: finalData.username,
          name: finalData.name,
          contactNumber: finalData.contactNumber,
        })
        response = { ...regResponse, ...customerRegResponse }
      }
      setNeedsToVerify(true)
      toast.info("Email has been sent to registered email for verification")
    } else {
      response =
        role === "owner"
          ? await updateOwner(result)
          : await updateCustomer(result)
    }

    localStorage.setItem("role", finalData.role)
    setEmail(finalData.email)
    return response
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {!needsToVerify && (
        <div className="space-y-2">
          <BackButton from={from} />
          <div className="space-y-2">
            {user ? (
              <p className="text-sm text-gray-600">
                Editing profile as{" "}
                <span className="font-semibold">{user.role}</span>
              </p>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Register As
                </label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      )}
      {needsToVerify ? (
        <EmailVerificationForm email={email} onSubmit={resendVerification} />
      ) : role === "customer" ? (
        <CustomerForm
          onRegister={handleRegister}
          user={user}
          from={from}
          isLoading={isLoading}
          isUpdate={isUpdate}
        />
      ) : (
        <OwnerForm
          onRegister={handleRegister}
          user={user}
          from={from}
          isLoading={isLoading}
          isUpdate={isUpdate}
        />
      )}
    </div>
  )
}

export default RegisterForm
