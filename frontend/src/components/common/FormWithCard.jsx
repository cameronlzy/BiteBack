import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form"
import SubmitButton from "./SubmitButton"
import { Eye, EyeOff } from "lucide-react"

const FormWithCard = ({ title, description, onSubmit, form, inputFields }) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              {inputFields.map(({ name, label, placeholder }) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder={placeholder}
                            type={
                              name === "password" && showPassword
                                ? "text"
                                : name === "password"
                                ? "password"
                                : "text"
                            }
                            {...field}
                          />
                          {name === "password" && (
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                              tabIndex={-1}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <SubmitButton
                type="submit"
                className="w-full"
                disabled={!form.formState.isValid}
                condition={form.formState.isSubmitting}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default FormWithCard
