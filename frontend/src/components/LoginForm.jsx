"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Form from "./common/FormWithCard"
import { Link, useNavigate } from "react-router-dom"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  password: z
    .string()
    .min(6, {
      message: "Password must be at least 6 characters.",
    })
    .max(20, {
      message: "Password must not be longer than 20 characters.",
    }),
})

export default function LoginForm({ onLogin }) {
  const navigate = useNavigate()
  function onSubmit(values) {
    // console.log(values)
    // Perform login logic here
    onLogin(values)
    navigate("/", { replace: true })
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  return (
    <div>
      <Form
        title="Login"
        description="Enter your credentials to login"
        inputFields={[
          { name: "username", label: "Username", placeholder: "your username" },
          { name: "password", label: "Password", placeholder: "your password" },
        ]}
        buttonText="Login"
        onSubmit={onSubmit}
        form={form}
      />
      <p>
        If you dont have an account, you can register{" "}
        <Link to="/register" className="underline-link">
          here
        </Link>
      </p>
    </div>
  )
}
