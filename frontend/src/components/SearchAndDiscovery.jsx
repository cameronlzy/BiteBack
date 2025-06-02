import React, { useState } from "react"
import { Button } from "./ui/button"
import { toast } from "react-toastify"

const SearchAndDiscovery = () => {
  const [location, setLocation] = useState(null)

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error)
    } else {
      toast.error("Geolocation not supported")
    }
  }

  const success = (position) => {
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    setLocation({ latitude, longitude })
  }

  const error = (err) => {
    toast.error(`Error retrieving location: ${err.message}`)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Search and Discovery</h2>
      <Button onClick={handleLocationClick}>Get Current Location</Button>
      {location && (
        <div className="mt-4">
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </div>
      )}
      Your current location:
      {location ? `${location.latitude}, ${location.longitude}` : "Not set"}
    </div>
  )
}

export default SearchAndDiscovery
