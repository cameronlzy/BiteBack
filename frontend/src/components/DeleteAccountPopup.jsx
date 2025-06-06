import { useForm, FormProvider } from "react-hook-form"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { useConfirm } from "./common/ConfirmProvider"
import { useState } from "react"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { deleteAccountSchema } from "../utils/schemas"
import { deleteAccount } from "@/services/userService"
import { toast } from "react-toastify"
import LoadingSpinner from "./common/LoadingSpinner"

const DeleteAccountPopup = ({ onClose, role, isLoading }) => {
  const confirm = useConfirm()
  const [confirming, setConfirming] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  if (isLoading) return <LoadingSpinner />
  const form = useForm({
    resolver: safeJoiResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
    },
    mode: "onSubmit",
  })

  const onSubmit = async (data) => {
    setConfirming(true)
    try {
      const confirmed = await confirm(
        "Are you sure you want to delete your account?"
      )

      if (!confirmed) return
      const response = await deleteAccount(data, role)
      window.location = "/"
    } catch (ex) {
    } finally {
      form.reset()
      setConfirming(false)
      localStorage.removeItem("role")
      onClose()
    }
  }

  return (
    <div>
      {!confirming && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-white p-6 rounded shadow space-y-4 max-w-sm w-full">
            <h2 className="text-xl font-semibold">Confirm Account Deletion</h2>
            <p className="text-sm text-gray-600">
              Please enter your password to permanently delete your account.
            </p>

            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive">
                    Confirm Delete
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeleteAccountPopup
