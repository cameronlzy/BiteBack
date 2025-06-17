import { use, useEffect, useState } from "react"
import CustomerForm from "@/components/CustomerForm"
import OwnerForm from "@/components/OwnerForm"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { updateOwner, updateCustomer } from "@/services/userService"
import BackButton from "./common/BackButton"
import { useLocation, useNavigate } from "react-router-dom"
import { objectComparator } from "@/utils/objectComparator"
import { convertOpeningHoursToString } from "@/utils/timeConverter"
import auth, { register } from "@/services/authService"

const RegisterForm = ({ user, isLoading }) => {
  const [role, setRole] = useState(user?.role || "customer")
  const [ownerForm, setOwnerForm] = useState(null)
  const [customerForm, setCustomerForm] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/"
  useEffect(() => {
    if (user && location.pathname === "/register") {
      navigate("/me/edit", { replace: true })
    }
  }, [user, location.pathname, navigate])
  const deepClean = (obj) =>
    Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== "")
        .map(([key, value]) => [
          key,
          value && typeof value === "object" && !Array.isArray(value)
            ? deepClean(value)
            : value,
        ])
    )

  const handleRegister = async (userToSubmit) => {
    let cleanedUser = Object.fromEntries(
      Object.entries(userToSubmit).filter(([_, value]) => value !== "")
    )

    if (
      cleanedUser.role === "owner" &&
      Array.isArray(cleanedUser.restaurants)
    ) {
      cleanedUser.restaurants = cleanedUser.restaurants.map((restaurant) => {
        const rest = deepClean(restaurant)
        rest.openingHours = convertOpeningHoursToString(rest.openingHours)
        return rest
      })
    }

    try {
      const finalData = user ? { ...cleanedUser, _id: user._id } : cleanedUser
      const result = objectComparator(user, finalData)
      if (user && Object.keys(result).length === 0) {
        return
      }
      // TO CFM role is included
      const response =
        role === "owner"
          ? user
            ? await updateOwner(result)
            : await register(finalData)
          : user
          ? await updateCustomer(result)
          : await register(finalData)
      localStorage.setItem("role", role)
      return response
    } catch (ex) {
      throw ex
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
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

      {role === "customer" ? (
        <CustomerForm
          onRegister={handleRegister}
          setFormRef={setCustomerForm}
          user={user}
          from={from}
          isLoading={isLoading}
        />
      ) : (
        <OwnerForm
          onRegister={handleRegister}
          setFormRef={setOwnerForm}
          user={user}
          from={from}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

export default RegisterForm
