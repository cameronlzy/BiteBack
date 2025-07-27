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
import { ToggleGroup } from "../ui/toggle-group"
import { ToggleGroupItem } from "@radix-ui/react-toggle-group"
import GoogleAuthorisationButton from "../authorisation/GoogleAuthorisationButton"

const FormWithCard = ({
  title,
  description,
  onSubmit,
  form,
  inputFields,
  role,
  setRole,
  onGoogleRedirect,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {role && setRole && (
          <div className="space-y-2 flex flex-col items-center mb-2">
            <label className="text-sm font-medium">Select Role</label>
            <ToggleGroup
              type="single"
              value={role}
              onValueChange={(value) => {
                if (value) setRole(value)
              }}
              className="flex gap-2"
            >
              <ToggleGroupItem
                value="customer"
                className="px-3 py-2 text-sm border rounded-md data-[state=on]:bg-primary data-[state=on]:text-white hover:bg-accent hover:text-accent-foreground"
                aria-label="Customer"
              >
                Customer
              </ToggleGroupItem>
              <ToggleGroupItem
                value="owner"
                className="px-4 py-2 text-sm border rounded-md data-[state=on]:bg-primary data-[state=on]:text-white hover:bg-accent hover:text-accent-foreground"
                aria-label="Owner"
              >
                Owner
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
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
        {onGoogleRedirect && (
          <GoogleAuthorisationButton
            onClick={onGoogleRedirect}
            padding="mt-4"
          />
        )}
      </CardContent>
    </Card>
  )
}

export default FormWithCard
