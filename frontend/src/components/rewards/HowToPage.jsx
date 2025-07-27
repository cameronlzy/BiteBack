import { X } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { AnimatePresence, motion } from "framer-motion"

const HowToPage = ({ showHowTo, setShowHowTo }) => {
  return (
    <AnimatePresence>
      {showHowTo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
        >
          <Card className="w-full max-w-md shadow-lg relative">
            <CardHeader className="flex flex-col gap-2 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  How To Get Points
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHowTo(false)}
                  aria-label="Close"
                  className="absolute right-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 py-4">
              <ul className="list-disc list-inside text-lg space-y-2">
                <li>
                  <span className="font-medium">Visits to Restaurants:</span>{" "}
                  Earn <strong>100 points</strong> for each visit.
                </li>
                <li>
                  <span className="font-medium">Leave a Review:</span> Earn{" "}
                  <strong>2 points</strong> per review.
                </li>
              </ul>
              <p className="text-base italic text-muted-foreground">
                All the best!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default HowToPage
