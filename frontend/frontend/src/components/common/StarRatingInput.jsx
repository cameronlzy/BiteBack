import { Star } from "lucide-react"

const StarRatingInput = ({ value = 0, onChange }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((val) => (
        <Star
          key={val}
          onClick={() => onChange(val)}
          className={`h-6 w-6 cursor-pointer transition-colors ${
            val <= value
              ? "fill-yellow-400 stroke-yellow-400"
              : "stroke-gray-400"
          }`}
        />
      ))}
    </div>
  )
}

export default StarRatingInput
