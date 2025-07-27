import { useState } from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import SubmitButton from "../common/SubmitButton"
import { saveReward } from "@/services/rewardService"
import { MinusCircle, PlusCircle } from "lucide-react"
import { Separator } from "../ui/separator"
import { toast } from "react-toastify"

const RewardRestock = ({ reward, restaurantId, setReward }) => {
  const [stock, setStock] = useState(reward.stock || 0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await saveReward(restaurantId, { stock, _id: reward._id })
      setReward((prev) => ({ ...prev, stock }))
      toast.success("Stock updated successfully to " + stock)
    } catch (ex) {
      console.log(ex)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-1/3 h-fit mx-auto gap-2 mt-3 p-0">
      <CardHeader className="pb-1 pt-2 px-3">
        <CardTitle className="text-sm font-semibold text-center">
          Reward Restock
        </CardTitle>
        <Separator />
      </CardHeader>

      <CardContent className="flex items-center justify-center gap-9 px-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setStock((prev) => Math.max(0, prev - 1))}
          className="rounded-md"
        >
          <MinusCircle className="w-5 h-5" />
        </Button>
        <span className="text-xl font-medium whitespace-nowrap">{stock}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setStock((prev) => prev + 1)}
          className="rounded-md"
        >
          <PlusCircle className="w-5 h-5" />
        </Button>
      </CardContent>

      <CardFooter className="justify-center w-full pb-3">
        <SubmitButton
          onClick={handleSubmit}
          condition={loading}
          normalText="Update Stock"
          loadingText="Updating..."
          size="default"
          className="w-full"
        />
      </CardFooter>
    </Card>
  )
}

export default RewardRestock
