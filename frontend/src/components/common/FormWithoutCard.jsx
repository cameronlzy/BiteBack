"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form"
const FormWithoutCard = ({
  title,
  description,
  buttonText,
  onSubmit,
  form,
  inputFields,
}) => {
  if (!form || !form.control) {
    console.error("Form or form control is not defined")
    return null
  }
  return (
    <div className="mx-auto max-w-sm">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p>{description}</p>
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
                      <Input placeholder={placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isValid}
            >
              {buttonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default FormWithoutCard
