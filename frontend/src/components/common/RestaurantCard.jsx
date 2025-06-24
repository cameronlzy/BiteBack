import { Link } from "react-router-dom"
import { Card, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import StarRating from "./StarRating"
import defaultRestImg from "@/assets/default-restaurant-img.png"

const RestaurantCard = ({
  _id,
  name,
  images,
  cuisines,
  address,
  averageRating,
  tags = [],
  reviewCount,
  distance,
  currentTag,
}) => {
  const sortedTags = (() => {
    if (!currentTag) return tags

    const currentTagsArray = Array.isArray(currentTag)
      ? currentTag.map((t) => t.toLowerCase())
      : [currentTag.toLowerCase()]

    const matching = tags.filter((tag) =>
      currentTagsArray.some((ct) => tag.toLowerCase().includes(ct))
    )

    const nonMatching = tags.filter(
      (tag) => !currentTagsArray.some((ct) => tag.toLowerCase().includes(ct))
    )

    return [...matching, ...nonMatching]
  })()
  const imageSrc = images?.[0] || defaultRestImg

  return (
    <Card className="w-full h-auto p-4 rounded-xl shadow-md space-y-3">
      <div>
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-36 object-cover rounded-lg border border-gray-200 shadow-sm"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = defaultRestImg
          }}
        />
      </div>

      <div className="text-left space-y-2 w-full break-words">
        <CardTitle className="text-2xl font-bold">
          <Link
            to={`/restaurants/${_id}`}
            className="text-black hover:text-gray-700 hover:underline transition-colors"
            state={{ from: location.pathname }}
          >
            {name}
          </Link>
        </CardTitle>

        <div className="flex gap-2 text-sm text-black font-medium pb-1 flex-wrap">
          {cuisines?.slice(0, 3).map((cuisine) => (
            <span key={cuisine} className="bg-gray-100 px-2 py-1 rounded-md">
              {cuisine}
            </span>
          ))}
        </div>
        {tags?.length > 0 && (
          <div className="flex gap-2 text-sm text-indigo-600 font-medium pb-1 flex-wrap">
            {sortedTags.slice(0, 2).map((tag) => (
              <span key={tag} className="bg-indigo-100 px-2 py-1 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center sm:justify-start text-sm text-gray-700">
          <MapPin className="w-4 h-4 mr-1" />
          {address}
          {distance != null && (
            <>
              {" "}
              {distance >= 1000
                ? `${(distance / 1000).toFixed(1)} km`
                : `${distance.toFixed(1)} m`}
            </>
          )}
        </div>

        <div className="flex items-center justify-center sm:justify-start">
          <StarRating rating={averageRating} />
          <span className="ml-2 text-sm text-gray-600">
            <b>{averageRating?.toFixed(1)}</b> (
            {reviewCount === 1
              ? `${reviewCount || 0} review`
              : `${reviewCount || 0} reviews`}
            )
          </span>
        </div>
      </div>
    </Card>
  )
}

export default RestaurantCard
