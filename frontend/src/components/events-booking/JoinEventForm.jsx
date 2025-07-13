import { useForm, FormProvider } from "react-hook-form"
import { joiResolver } from "@hookform/resolvers/joi"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { saveReservation } from "@/services/reservationService"
import { DateTime } from "luxon"
import { joinEventSchema } from "@/utils/schemas"
import { objectCleaner } from "@/utils/objectComparator"
import { Info } from "lucide-react"

const JoinEventForm = ({ event, setShowForm }) => {
  const form = useForm({
    resolver: joiResolver(joinEventSchema),
    defaultValues: {
      pax: 1,
      remarks: "",
    },
  })

  const { handleSubmit, control, formState } = form
  const onSubmit = async (values) => {
    try {
      const reservationDate = DateTime.fromISO(event.startDate, {
        zone: "Asia/Singapore",
      }).toISO()

      const payload = {
        restaurant: event.restaurant,
        startDate: reservationDate,
        pax: values.pax,
        remarks: values.remarks,
        event: event._id,
      }

      const finalPayload = objectCleaner(payload)

      await saveReservation(finalPayload, false)
      toast.success("Successfully joined event")
      form.reset()
      setShowForm(false)
    } catch (ex) {
      const message =
        ex.response?.data?.error || "An unexpected error occurred while joining"

      toast.error("Failed to join event")
      form.setError("pax", {
        type: "manual",
        message,
      })
      throw ex
    }
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border p-4 mt-4 rounded-md bg-gray-50 space-y-4"
      >
        <FormField
          control={control}
          name="pax"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pax</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={event.maxPaxPerCustomer}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Info className="w-4 h-4" />
                Max guests per customer: {event.maxPaxPerCustomer}
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Input placeholder="Any remarks?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full"
        >
          {formState.isSubmitting ? "Submitting..." : "Join Event"}
        </Button>
      </form>
    </FormProvider>
  )
}

export default JoinEventForm
