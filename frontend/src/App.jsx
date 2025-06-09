import "./App.css"
import { useEffect, useState, Fragment } from "react"
import { Routes, Route } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import auth from "./services/authService"
import { getCustomerInfo, getOwnerInfo } from "./services/userService"
import Home from "./components/Home"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import Restaurants from "./components/RestaurantsPage"
import NavBar from "./components/NavBar"
import Restaurant from "./components/Restaurant"
import ReservationForm from "./components/ReservationForm"
import NotFound from "./components/Not-Found"
import ProtectedRoute from "@/components/common/ProtectedRoute"
import ProfilePage from "./components/ProfilePage"
import RestaurantForm from "./components/RestaurantForm"
import SearchAndDiscovery from "./components/SearchAndDiscovery"
import GeneralProfilePage from "./components/GeneralProfilePage"
import ForgotPassword from "./components/ForgotPassword"
import ResetPassword from "./components/ResetPassword"
import ImageShow from "./components/common/ImageShow"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const msg = localStorage.getItem("toastMessage")
    if (msg) {
      toast.success(msg)
      setTimeout(() => {
        localStorage.removeItem("toastMessage")
      }, 100)
    }
  }, [])
  useEffect(() => {
    const savedRole = localStorage.getItem("role")

    if (!savedRole) {
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const user =
          savedRole === "owner" ? await getOwnerInfo() : await getCustomerInfo()

        setUser(user)
      } catch (ex) {
        if (ex.response?.status === 401) {
          await auth.logout()
          localStorage.removeItem("role")
          toast.info("Please re-login")
        } else {
          setUser(null)
          throw ex
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return (
    <Fragment>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
            <NavBar
              name="BiteBack"
              links={
                !user
                  ? [
                      {
                        type: "link",
                        path: "/restaurants",
                        name: "Restaurants",
                      },
                      { type: "link", path: "/login", name: "Login" },
                      { type: "link", path: "/register", name: "Register" },
                    ]
                  : [
                      {
                        type: "link",
                        path: "/restaurants",
                        name: "Restaurants",
                      },
                      { type: "link", path: "/me", name: "Profile" },
                    ]
              }
            />
          }
        >
          <Route
            path="login"
            element={<LoginForm user={user} loading={loading} />}
          />
          <Route index element={<Home user={user} />} />
          <Route path="register" element={<RegisterForm user={user} />} />
          <Route
            path="me/edit"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<RegisterForm user={user} isLoading={loading} />}
              />
            }
          />

          <Route path="restaurants" element={<Restaurants />} />
          <Route path="restaurants/:id" element={<Restaurant user={user} />} />
          <Route
            path="reservation/:restaurantId"
            element={
              <ProtectedRoute
                loading={loading}
                element={<ReservationForm user={user} />}
                user={user}
              />
            }
          />
          <Route
            path="reservation/:restaurantId/edit/:reservationId"
            element={
              <ProtectedRoute
                loading={loading}
                element={<ReservationForm user={user} />}
                user={user}
              />
            }
          />
          <Route
            path="/me"
            element={
              <ProtectedRoute
                loading={loading}
                element={<ProfilePage user={user} isLoading={loading} />}
                user={user}
              />
            }
          />
          <Route
            path="restaurants/edit/:restaurantId"
            element={
              <ProtectedRoute
                loading={loading}
                element={<RestaurantForm user={user} />}
                user={user}
              />
            }
          />
          <Route
            path="restaurants/new"
            element={
              <ProtectedRoute
                loading={loading}
                element={<RestaurantForm user={user} />}
                user={user}
              />
            }
          />
          <Route path="search-discovery" element={<SearchAndDiscovery />} />
          <Route
            path="user-details/:custId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<GeneralProfilePage user={user} />}
              />
            }
          />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
          <Route
            path="change-password"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<ResetPassword user={user} />}
              />
            }
          />
          <Route path="not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
          <Route path="images/:imageUrl" element={<ImageShow />} />
        </Route>
      </Routes>
    </Fragment>
  )
}

export default App
