import pinImg from "@/assets/map-pin.png"

const AntiOverlapPin = ({ mapRef, activePopupId, restaurants, r }) => {
  const map = mapRef.current?.getMap()
  if (!map || !activePopupId || r._id === activePopupId) {
    return (
      <img
        src={pinImg}
        alt="pin"
        className="w-8 h-auto drop-shadow relative"
        style={{ zIndex: 1 }}
      />
    )
  }

  const popupR = restaurants.find((res) => res._id === activePopupId)
  if (!popupR || !popupR.location?.coordinates) return null

  const popupXY = map.project(popupR.location.coordinates)
  const markerXY = map.project(r.location.coordinates)

  const isOverlapped =
    markerXY.x >= popupXY.x - 110 &&
    markerXY.x <= popupXY.x + 110 &&
    markerXY.y >= popupXY.y - 190 &&
    markerXY.y <= popupXY.y

  if (isOverlapped) return null

  return (
    <img
      src={pinImg}
      alt="pin"
      className="w-8 h-auto drop-shadow relative"
      style={{ zIndex: 1 }}
    />
  )
}
export default AntiOverlapPin
