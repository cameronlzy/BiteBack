import { useEffect, useState, useRef } from "react"
import { getPromotions } from "@/services/promotionService"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"

const BannerCarousel = () => {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchTop5Promotions = async () => {
      try {
        const { promotions } = await getPromotions({
          page: 1,
          limit: 5,
          sortBy: "startDate",
          order: "desc",
        })
        setBanners(promotions.filter((p) => p.bannerImage))
      } catch (ex) {
        console.error("Failed to fetch banners:", ex)
        throw ex
      }
    }
    fetchTop5Promotions()
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [banners.length])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    )
    resetInterval()
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    )
    resetInterval()
  }

  const resetInterval = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)
  }

  if (banners.length === 0) return null

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden py-2">
        <div className="relative aspect-[5/1] w-full rounded-lg overflow-hidden shadow-md border">
          {banners.map((banner, index) => (
            <Link
              key={banner._id}
              to={`/promotions/${banner._id}`}
              state={{ from: "/" }}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={banner.bannerImage}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            </Link>
          ))}
        </div>

        <Button
          onClick={goToPrevious}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/30 hover:bg-white/80 rounded-full p-2 shadow-md w-3"
        >
          <ChevronLeft className="w-2 h-2 text-black" />
        </Button>
        <Button
          onClick={goToNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/30 hover:bg-white/80 rounded-full p-2 shadow-md w-3"
        >
          <ChevronRight className="w-2 h-2 text-black" />
        </Button>
      </div>
    </div>
  )
}

export default BannerCarousel
