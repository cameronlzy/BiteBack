export async function getRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`

  const res = await fetch(url)
  const data = await res.json()

  const coords = data.routes[0].geometry.coordinates
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      },
    ],
  }
}