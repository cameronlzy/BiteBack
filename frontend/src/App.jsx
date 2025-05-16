import { useEffect, useState } from "react"
import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"
import LoginForm from "./components/LoginForm"
import { Routes, Route, useParams } from "react-router-dom"
import Home from "./components/Home"
import RegisterForm from "./components/RegisterForm"
import Restaurants from "./components/RestaurantsPage"
import NavBar from "./components/NavBar"
import { getRestaurants } from "./services/fakeRestaurantService"
import Restaurant from "./components/Restaurant"
import { get } from "react-hook-form"
import ReservationPage from "./components/ReservationPage"

function App() {
  const [count, setCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [allRestaurants, setAllRestaurants] = useState(getRestaurants())

  useEffect(() => {
    setRestaurants(allRestaurants)
  }, [])

  const handleSearch = (searchTerm) => {
    const filtered = allRestaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setRestaurants(filtered)
  }
  const handleLogin = (user) => {
    setLoggedIn(true)
  }
  const handleRegister = (user) => {
    setLoggedIn(true)
    console.log("success")
  }

  const handleDateTimeChange = (date) => {
    // Call Backend API to get available dates for the selected restaurant
    // Set Backend API response to state
    console.log("Date Time changed to: ", date)
  }
  const RestaurantWrapper = (Class) => {
    return (props) => {
      const { id } = useParams()
      const restaurant = allRestaurants.find((r) => String(r.id) === id)
      return <Class restaurant={restaurant} {...props} />
    }
  }

  const RestaurantWithData = RestaurantWrapper(Restaurant)
  const ReservationWithData = RestaurantWrapper(ReservationPage)

  return (
    <div className="container">
      <Routes>
        <Route
          path="/"
          element={
            <NavBar
              name="BiteBack"
              links={
                !loggedIn
                  ? [
                      { type: "link", path: "/login", name: "Login" },
                      { type: "link", path: "/register", name: "Register" },
                    ]
                  : [
                      {
                        type: "link",
                        path: "/restaurants",
                        name: "Restaurants",
                      },
                    ]
              }
            />
          }
        >
          <Route path="login" element={<LoginForm onLogin={handleLogin} />} />
          <Route index element={<Home />} />
          <Route
            path="register"
            element={<RegisterForm onRegister={handleRegister} />}
          />
          <Route
            path="restaurants"
            element={
              <Restaurants restaurants={restaurants} onChange={handleSearch} />
            }
          />
          <Route path="restaurants/:id" element={<RestaurantWithData />} />
          <Route
            path="reservation/:id"
            element={<ReservationWithData onChange={handleDateTimeChange} />}
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
