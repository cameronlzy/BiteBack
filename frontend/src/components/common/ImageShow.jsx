import { useParams, useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"

const ImageShow = () => {
  const { imageUrl } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const restaurant = location?.state?.restaurant
  const [failedToLoad, setFailedToLoad] = useState(false)

  if (!imageUrl) return <p className="text-center mt-10">No image specified</p>

  const decodedUrl = decodeURIComponent(imageUrl)

  return (
    <div className="relative w-full h-screen bg-white flex items-center justify-center">
      <button
        className="absolute top-4 right-4 text-white bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
        onClick={() =>
          navigate(location.state?.from || -1, {
            state: {
              imageShow: true,
            },
          })
        }
      >
        x
      </button>
      {failedToLoad ? (
        <p className="text-white text-lg">Failed to load image</p>
      ) : (
        <img
          src={decodedUrl}
          alt="Expanded view"
          className="w-auto h-auto max-w-full max-h-full object-contain"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={() => setFailedToLoad(true)}
        />
      )}
    </div>
  )
}

export default ImageShow
