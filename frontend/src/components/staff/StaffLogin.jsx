import { useForm } from "react-hook-form"
import React from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { loginStaffSchema } from "@/utils/schemas"
import FormWithCard from "@/components/common/FormWithCard"
import { staffLogin } from "@/services/staffService"
import LoadingSpinner from "@/components/common/LoadingSpinner"
import { toast } from "react-toastify"

const StaffLogin = ({ user, loading, setUser }) => {
  const location = useLocation()
  const from = location.state?.from || "/staff/control-center"
  const navigate = useNavigate()
  const form = useForm({
    resolver: safeJoiResolver(loginStaffSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const redirectPath = "/staff/control-center"

  if (loading) return <LoadingSpinner />
  if (user && user.role !== "staff") {
    toast.info("You are not authorised to access the staff portal", {
      toastId: "non-staff-redirect",
    })
    return <Navigate to="/" replace />
  }
  if (user && user.role === "staff") return <Navigate to={from} replace />

  async function onSubmit(credentials) {
    try {
      const data = await staffLogin(credentials)
      localStorage.setItem("role", "staff")
      localStorage.setItem("restaurant", data.restaurant)
      localStorage.setItem("staffUser", JSON.stringify(data))
      setUser({ ...data, role: "staff" })
      navigate(redirectPath, { replace: true })
      toast.success("Staff Login Successful")
    } catch (ex) {
      if (ex.response?.status === 400) {
        const message = ex.response.data.error || "Invalid login credentials"
        form.setError("username", {
          type: "manual",
          message,
        })
      } else {
        toast.error("Login failed")
      }
    }
  }

  const inputFields = [
    {
      name: "username",
      label: "Staff User",
      placeholder: "your staff username",
    },
    { name: "password", label: "Password", placeholder: "your password" },
  ]

  return (
    <React.Fragment>
      <FormWithCard
        title="Staff Login"
        description="Login with your staff credentials"
        inputFields={inputFields}
        buttonText="Login"
        onSubmit={onSubmit}
        form={form}
      />
      <p>
        Not a staff?{" "}
        <Link to="/login" className="underline-link">
          Go to User Login
        </Link>
      </p>
    </React.Fragment>
  )
}

export default StaffLogin
