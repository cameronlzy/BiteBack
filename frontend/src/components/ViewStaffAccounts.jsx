import React from "react"
import { useState } from "react"
import { getStaffAccounts } from "@/services/userService"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"
import SubmitButton from "./common/SubmitButton"

const ViewStaffAccounts = () => {
  const [password, setPassword] = useState("")
  const [staffData, setStaffData] = useState([])
  const [showFormPassword, setShowFormPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const staffList = await getStaffAccounts(password)
      setStaffData(staffList)
      setSubmitted(true)
    } catch {
      toast.error("Invalid password or failed to fetch staff accounts")
    } finally {
      setLoading(false)
    }
  }

  const togglePassword = (index) => {
    setShowPasswords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  return (
    <div className="mt-8 border rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">View Staff Accounts</h2>

      {!submitted && (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center mb-4">
          <div className="relative w-full">
            <Input
              type={showFormPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="pr-8"
            />
            <button
              type="button"
              onClick={() => setShowFormPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
              tabIndex={-1}
            >
              {showFormPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <SubmitButton
            type="submit"
            condition={loading}
            loadingText="Verifying..."
          />
        </form>
      )}

      {submitted && staffData.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No staff accounts found.
        </p>
      )}

      {staffData.map(({ staff, restaurant }, index) => (
        <div
          key={index}
          className="border p-4 mb-3 rounded-lg bg-gray-50 flex flex-col gap-1 items-center"
        >
          <p className="font-medium">{restaurant.name}</p>
          <p>Username: {staff.username}</p>
          <div className="relative w-fit">
            <Input
              type={showPasswords[index] ? "text" : "password"}
              value={staff.password}
              readOnly
              className="text-sm"
            />
            <button
              type="button"
              onClick={() => togglePassword(index)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords[index] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ViewStaffAccounts
