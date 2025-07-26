import React, { useState, useRef, useEffect } from "react"
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre"
import { ScaleControl } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useForm, Controller, FormProvider } from "react-hook-form"
import { toast } from "react-toastify"
import { Button } from "./ui/button"
import { MultiSelect } from "./common/MultiSelect"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { getFilteredRestaurants } from "@/services/restaurantService"
import RestaurantCard from "./common/RestaurantCard"
import { safeJoiResolver } from "@/utils/safeJoiResolver"
import { cuisineList, filterSchema, tagList } from "@/utils/schemas"
import { Link, useLocation } from "react-router-dom"
import { FormControl, FormItem, FormLabel, FormMessage } from "./ui/form"
import BackButton from "./common/BackButton"
import AntiOverlapPin from "./common/AntiOverlapPin"
import SearchSubmit from "./common/SubmitButton"

const MAP_STYLE = `https://api.maptiler.com/maps/streets/style.json?key=${
  import.meta.env.VITE_MAPTILER_TOKEN
}`

const SearchAndDiscovery = () => {
  const [position, setPosition] = useState(null)
  const [heading, setHeading] = useState(0)
  const [restaurants, setRestaurants] = useState([])
  const [searched, setSearched] = useState(false)
  const [activePopupId, setActivePopupId] = useState(null)
  const [useDistanceFilter, setUseDistanceFilter] = useState(false)
  const [radiusKm, setRadiusKm] = useState(1)
  const mapRef = useRef(null)
  const hasAddedScale = useRef(false)

  const location = useLocation()
  const from = location.state?.from

  const featureList = tagList.slice(0, 5)
  const dietaryList = tagList.slice(5)

  const form = useForm({
    resolver: safeJoiResolver(filterSchema),
    defaultValues: {
      cuisines: [],
      features: [],
      dietary: [],
      minRating: 0,
      radius: null,
      lat: null,
      lng: null,
      openNow: false,
    },
  })

  useEffect(() => {
    const restoreFromCache = async () => {
      const isFromRestaurantDetails =
        from && /^\/restaurants\/[^/]+$/.test(from)
      if (!isFromRestaurantDetails) return

      const cached = sessionStorage.getItem("discoveryFilters")
      if (!cached) return

      const { formData, position: cachedPosition } = JSON.parse(cached)

      if (formData) {
        for (const [key, value] of Object.entries(formData)) {
          form.setValue(key, value)
        }
      }

      if (cachedPosition) {
        setPosition(cachedPosition)
        form.setValue("lat", cachedPosition.latitude)
        form.setValue("lng", cachedPosition.longitude)
      }

      setSearched(true)

      const isValid = await form.trigger()
      if (isValid) {
        await onSubmit({ ...formData })
      }
    }

    restoreFromCache()
  }, [])

  const handlePositionClick = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported")
      return
    }

    try {
      const status = await navigator.permissions.query({ name: "geolocation" })

      if (status.state === "denied") {
        toast.error(
          "Location access denied. Please allow location permissions."
        )
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, heading } = pos.coords
          setPosition({ latitude, longitude })
          if (typeof heading === "number" && !isNaN(heading)) {
            setHeading(heading)
          }
          form.setValue("lat", latitude)
          form.setValue("lng", longitude)
        },
        (err) => {
          console.error("Geo error:", err)
          toast.error("Unable to fetch location. Try reconnecting Wi-Fi.")
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } catch (ex) {
      console.error(ex)
      toast.error("Unable to check location permission.")
    }
  }

  const handleSearchClick = () => {
    if (useDistanceFilter) {
      form.setValue("radius", radiusKm)
    } else {
      form.setValue("radius", null)
    }

    form.handleSubmit(onSubmit)()
  }

  const onSubmit = async (data) => {
    try {
      const { features, dietary, radius, lat, lng, ...rest } = data

      const params = {
        ...rest,
        tags: [...(features || []), ...(dietary || [])],
        ...(radius &&
          radius > 0 && {
            radius: Math.round(radius * 1000),
            lat,
            lng,
          }),
      }

      const results = await getFilteredRestaurants(params)
      setRestaurants(results)
      setSearched(true)

      if (position) {
        sessionStorage.setItem(
          "discoveryFilters",
          JSON.stringify({ formData: data, position })
        )
      }
    } catch (ex) {
      console.log(ex)
      toast.error("Failed to filter restaurants")
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton from="/restaurants" />
        <h2 className="text-3xl font-bold text-center w-full -ml-8">
          Discover New Restaurants
        </h2>
      </div>

      <div className="flex justify-center">
        {position ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            User Location Received
          </div>
        ) : (
          <Button onClick={handlePositionClick}>Get Current Location</Button>
        )}
      </div>

      <FormProvider {...form}>
        <Card className="shadow-lg border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-center">
              Refine Your Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Controller
                control={form.control}
                name="cuisines"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Cuisines</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={cuisineList}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Features Provided</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={featureList}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="dietary"
                render={({ field }) => (
                  <FormItem className="space-y-2 mb-4">
                    <FormLabel>Dietary Requirements</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={dietaryList}
                        selected={field.value || []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Controller
                control={form.control}
                name="minRating"
                render={({ field: { value, onChange } }) => (
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Minimum Rating:{" "}
                      <span className="font-semibold">{value}</span>
                    </label>
                    <Slider
                      min={0}
                      max={5}
                      step={0.1}
                      value={[value]}
                      onValueChange={([v]) => onChange(v)}
                    />
                  </div>
                )}
              />

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-radius"
                    checked={useDistanceFilter}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        if (!position) {
                          toast.info(
                            "You must get your location first before using distance filter"
                          )
                          return
                        }
                        form.setValue("lat", position.latitude)
                        form.setValue("lng", position.longitude)
                      } else {
                        form.setValue("lat", null)
                        form.setValue("lng", null)
                      }
                      setUseDistanceFilter(checked)
                    }}
                  />
                  <label htmlFor="enable-radius" className="text-sm">
                    Filter by Distance
                  </label>
                </div>

                {useDistanceFilter && (
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Max Distance to Restaurant (km):{" "}
                      <span className="font-semibold">
                        {radiusKm.toFixed(1)}
                      </span>
                    </label>
                    <Slider
                      min={0.1}
                      max={10}
                      step={0.1}
                      value={[radiusKm]}
                      onValueChange={([v]) => {
                        setRadiusKm(v)
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="relative flex justify-center">
                <div className="items-center">
                  <SearchSubmit
                    type="button"
                    onClick={handleSearchClick}
                    condition={form.formState.isSubmitting}
                    loadingText="Searching..."
                    normalText="Search"
                  />
                </div>

                <div className="ml-4 flex items-center space-x-2">
                  <Controller
                    control={form.control}
                    name="openNow"
                    render={({ field }) => (
                      <Checkbox
                        id="open-now"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <label htmlFor="open-now" className="text-sm">
                    Open Now
                  </label>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </FormProvider>

      {position && restaurants.length > 0 && (
        <div className="h-[400px] rounded-xl overflow-hidden border">
          <Map
            ref={mapRef}
            mapStyle={MAP_STYLE}
            initialViewState={{
              latitude: position.latitude,
              longitude: position.longitude,
              zoom: 15,
            }}
            style={{ width: "100%", height: "100%" }}
            onLoad={() => {
              const map = mapRef.current?.getMap()
              if (map && !hasAddedScale.current) {
                map.addControl(
                  new ScaleControl({ maxWidth: 100, unit: "metric" }),
                  "bottom-left"
                )
                hasAddedScale.current = true
              }
            }}
          >
            <NavigationControl position="top-left" />
            <Marker
              longitude={position.longitude}
              latitude={position.latitude}
              anchor="center"
            >
              <div className="bg-blue-500 w-6 h-6 rounded-full border-2 border-white relative z-0">
                <div
                  className="absolute left-1 top-[-10px]"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderBottom: "10px solid white",
                    transform: `rotate(${heading}deg)`,
                  }}
                />
              </div>
            </Marker>
            {restaurants.map(
              (r) =>
                r.location?.coordinates && (
                  <Marker
                    key={r._id}
                    longitude={r.location.coordinates[0]}
                    latitude={r.location.coordinates[1]}
                    anchor="bottom"
                    className="z-0"
                  >
                    <div
                      className="relative flex justify-center items-center cursor-pointer z-20"
                      onMouseEnter={() => setActivePopupId(r._id)}
                      onMouseLeave={() => setActivePopupId(null)}
                      onClick={() => setActivePopupId(r._id)}
                    >
                      <AntiOverlapPin
                        restaurants={restaurants}
                        mapRef={mapRef}
                        activePopupId={activePopupId}
                        r={r}
                      />
                      {activePopupId === r._id && (
                        <div
                          className="absolute bottom-8 w-52 p-3 bg-white border rounded-lg shadow-xl text-center"
                          style={{
                            zIndex: 9999,
                            pointerEvents: "auto",
                          }}
                        >
                          {r.images?.[0] && (
                            <img
                              src={r.images[0]}
                              alt={r.name}
                              className="w-full h-24 object-cover rounded-md mb-2"
                            />
                          )}
                          <Link
                            to={`/restaurants/${r._id}`}
                            className="font-semibold text-black hover:underline"
                            state={{ from: location.pathname }}
                          >
                            {r.name}
                          </Link>
                          <div className="text-s text-gray-600">
                            {r.address}
                          </div>
                          {r.distance
                            ? r.distance >= 1000
                              ? `${(r.distance / 1000).toFixed(1)} km`
                              : `${r.distance.toFixed(1)} m`
                            : null}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${r.location.coordinates[1]},${r.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="mt-2 w-full">
                              Get Directions
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </Marker>
                )
            )}
          </Map>
        </div>
      )}

      {searched && restaurants.length === 0 && (
        <div className="text-center text-gray-500 italic mt-6">
          No restaurants found. Try tweaking your search filters.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {restaurants.map((r) => (
          <RestaurantCard
            key={r._id}
            {...r}
            currentTag={[
              ...(form.getValues("features") || []),
              ...(form.getValues("dietary") || []),
            ]}
          />
        ))}
      </div>
    </div>
  )
}

export default SearchAndDiscovery
