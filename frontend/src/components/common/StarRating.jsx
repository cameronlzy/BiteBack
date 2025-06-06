import { Star } from "lucide-react"

const StarRating = ({ rating, className = "w-5 h-5" }) => {
  const stars = []

  for (let i = 1; i <= 5; i++) {
    const isFull = rating >= i
    const isPartial = rating > i - 1 && rating < i

    if (isFull) {
      stars.push(
        <Star
          key={i}
          className={`text-yellow-400 ${className}`}
          fill="currentColor"
        />
      )
    } else if (isPartial) {
      const fraction = rating - Math.floor(rating)
      stars.push(
        <div key={i} className={`relative ${className}`}>
          <Star className={`text-gray-300 ${className}`} fill="currentColor" />
          <div
            className="absolute top-0 left-0 h-full overflow-hidden"
            style={{ width: `${fraction * 100}%` }}
          >
            <Star
              className={`text-yellow-400 ${className}`}
              fill="currentColor"
            />
          </div>
        </div>
      )
    } else {
      stars.push(<Star key={i} className={`text-gray-300 ${className}`} />)
    }
  }

  return <div className="flex gap-1">{stars}</div>
}

export default StarRating
