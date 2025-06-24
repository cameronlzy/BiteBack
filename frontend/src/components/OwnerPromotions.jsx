import { Fragment, useEffect, useState } from "react"
import { getOwnerPromotions } from "@/services/promotionService"
import PromotionCard from "./common/PromotionCard"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { hasPromotionEnded } from "@/utils/timeConverter"
import { toast } from "react-toastify"

const OwnerPromotions = ({ user }) => {
  const [promotions, setPromotions] = useState([])
  const [showPromotions, setShowPromotions] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user.role !== "owner") {
      navigate("/not-found", { replace: true })
      return
    }

    const fetchPromotions = async () => {
      try {
        const data = await getOwnerPromotions()
        setPromotions(data)
      } catch (ex) {
        console.error("Failed to fetch owner promotions", ex)
        toast.error("Failed to fetch owner promotions")
        throw ex
      }
    }

    fetchPromotions()
  }, [user._id])

  const currentPromotions = promotions.filter((p) => !hasPromotionEnded(p))
  const pastPromotions = promotions.filter((p) => hasPromotionEnded(p))

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-bold mb-6">Your Promotions</h2>

      {promotions.length === 0 ? (
        <p className="text-gray-500">No Active Promotions</p>
      ) : (
        <Fragment>
          <Button
            variant="outline"
            size="sm"
            className="mb-4"
            onClick={() => setShowPromotions((prev) => !prev)}
          >
            {showPromotions ? "Hide Promotions" : "Show Promotions"}
          </Button>

          <AnimatePresence initial={false}>
            {showPromotions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <Button
                  className="mb-6"
                  onClick={() => navigate("/promotions/new")}
                >
                  Add New Promotion
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Past Promotions
                    </h3>
                    {pastPromotions.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {pastPromotions.map((promo) => (
                          <PromotionCard key={promo._id} {...promo} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No past promotions
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Current Promotions
                    </h3>
                    {currentPromotions.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {currentPromotions.map((promo) => (
                          <PromotionCard key={promo._id} {...promo} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No current promotions
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Fragment>
      )}
    </div>
  )
}

export default OwnerPromotions
