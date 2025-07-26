import { useForm } from "react-hook-form"
import React, { useState } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { loginUserSchema } from "@/utils/schemas"
import FormWithCard from "../common/FormWithCard"
import auth, { openGooglePopup } from "@/services/authService"
import LoadingSpinner from "../common/LoadingSpinner"
import { toast } from "react-toastify"

const LoginForm = ({ user, loading }) => {
  const [role, setRole] = useState("customer")
  const form = useForm({
    resolver: safeJoiResolver(loginUserSchema),
    mode: "onChange",
    defaultValues: {
      identifier: "",
      password: "",
    },
  })

  const location = useLocation()
  const from = location.state?.from || "/"

  if (loading) return <LoadingSpinner />

  if (user) return <Navigate to={from} replace />

  async function onSubmit(user) {
    try {
      const data = await auth.login(user)
      localStorage.setItem("role", data.role)
      window.location = from
      toast.success("Login Successful")
    } catch (ex) {
      if (ex.response?.status === 400 || ex.response?.status === 403) {
        const message = ex.response?.data?.error
        console.log(message)
        form.setError("identifier", {
          type: "manual",
          message:
            message ??
            (ex.response?.status === 400
              ? "Invalid email/username or password"
              : "Please verify your email before logging in"),
        })
      }
    }
  }

  const inputFields = [
    {
      name: "identifier",
      label: "Username or Email",
      placeholder: "your username or email",
    },
    { name: "password", label: "Password", placeholder: "your password" },
  ]

  const handleGoogleRedirect = async () => {
    try {
      localStorage.setItem("role", role)
      await openGooglePopup(role)
    } catch (ex) {
      toast.error("Google Auth Failed")
      throw ex
    }
  }

  return (
    <React.Fragment>
      <FormWithCard
        title="Login"
        description="Enter your credentials to login"
        inputFields={inputFields}
        buttonText="Login"
        onSubmit={onSubmit}
        form={form}
        role={role}
        setRole={setRole}
        onGoogleRedirect={handleGoogleRedirect}
      />
      <p>
        If you don&apos;t have an account, you can register{" "}
        <Link to="/register" className="underline-link">
          here
        </Link>
      </p>
      <Link to="/forgot-password" className="underline-link">
        Reset Password here
      </Link>
    </React.Fragment>
  )
}

export default LoginForm
