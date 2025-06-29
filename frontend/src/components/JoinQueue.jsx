import { useForm, FormProvider } from "react-hook-form"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import SubmitButton from "./common/SubmitButton"

const JoinQueue = ({ onJoin, restaurantId }) => {
  const methods = useForm({
    defaultValues: {
      pax: 1,
    },
    mode: "onChange",
  })

  const {
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods

  const pax = watch("pax")

  const onSubmit = async (data) => {
    const queueDetails = {
      pax: data.pax,
      restaurant: restaurantId,
    }
    if (onJoin) await onJoin(queueDetails)
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 max-w-sm mx-auto"
        >
          <FormField
            control={control}
            name="pax"
            render={() => (
              <FormItem className="flex flex-col items-center mt-6">
                <FormLabel className="text-base font-medium mb-2">
                  Number of Pax
                </FormLabel>
                <FormControl>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-10 h-10 text-xl"
                      onClick={() => setValue("pax", Math.max(1, pax - 1))}
                    >
                      -
                    </Button>

                    <div className="text-xl font-semibold w-10 text-center">
                      {pax}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-10 h-10 text-xl"
                      onClick={() => setValue("pax", pax + 1)}
                    >
                      +
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            type="submit"
            condition={isSubmitting}
            className="w-40"
            normalText="Join Queue"
            loadingText="Joining..."
          />
        </form>
      </Form>
    </FormProvider>
  )
}

export default JoinQueue
