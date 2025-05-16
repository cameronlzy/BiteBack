"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import Form from "./common/FormWithCard"

const formSchema = z
  .object({
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
    confirmPassword: z
      .string()
      .min(6, {
        message: "Password must be at least 6 characters.",
      })
      .max(20, {
        message: "Password must not be longer than 20 characters.",
      }),

    email: z.string().email({
      message: "Invalid email address",
    }),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }
  })

const RegisterForm = ({ onRegister }) => {
  const navigate = useNavigate()
  function onSubmit(values) {
    // console.log(values)
    // Perform login logic here
    onRegister(values)
    navigate("/", { replace: true })
  }

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
    },
  })
  return (
    <div>
      <Form
        title="Register"
        description="Enter your credentials to register"
        inputFields={[
          { name: "username", label: "Username", placeholder: "your username" },
          { name: "password", label: "Password", placeholder: "your password" },
          {
            name: "confirmPassword",
            label: "Confirm Password",
            placeholder: "confirm your password",
          },
          { name: "email", label: "Email", placeholder: "your email" },
        ]}
        buttonText="Register"
        onSubmit={onSubmit}
        form={form}
      />
      <p>
        If you already have an account, you can login{" "}
        <Link to="/login" className="underline-link">
          here
        </Link>
      </p>
    </div>
  )
}

export default RegisterForm
