import "./App.css"
import { useEffect, useState, Fragment } from "react"
import { Routes, Route } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import { getCustomerInfo, getOwnerInfo } from "./services/userService"
import Home from "./components/Home"
import LoginForm from "./components/authorisation/LoginForm"
import RegisterForm from "./components/authorisation/RegisterForm"
import Restaurants from "./components/RestaurantsPage"
import NavBar from "./components/NavBar"
import Restaurant from "./components/Restaurant"
import ReservationForm from "./components/reservations/ReservationForm"
import NotFound from "./components/Not-Found"
import ProtectedRoute from "./components/common/ProtectedRoute"
import ProfilePage from "./components/ProfilePage"
import RestaurantForm from "./components/RestaurantForm"
import SearchAndDiscovery from "./components/SearchAndDiscovery"
import GeneralProfilePage from "./components/GeneralProfilePage"
import ForgotPassword from "./components/authorisation/ForgotPassword"
import ResetPassword from "./components/authorisation/ResetPassword"
import ImageShow from "./components/common/ImageShow"
import OnlineQueue from "./components/queue/OnlineQueue"
import ProtectedStaffRoute from "./components/common/ProtectedStaffRoute"
import StaffLogin from "./components/staff/StaffLogin"
import StaffControlCenter from "./components/staff/StaffControlCenter"
import PromotionForm from "./components/promotions/PromotionForm"
import PromotionPage from "./components/promotions/PromotionPage"
import Promotions from "./components/promotions/Promotions"
import OwnerRestaurants from "./components/OwnerRestaurants"
import RestaurantPerformance from "./components/statistics/RestaurantPerformance"
import LoadingSpinner from "./components/common/LoadingSpinner"
import RestaurantRewardsStore from "./components/rewards/RestaurantRewardStore"
import RewardPage from "./components/rewards/RewardPage"
import CustomerRewards from "./components/rewards/CustomerRewards"
import RewardForm from "./components/rewards/RewardForm"
import OwnerStatistics from "./components/statistics/OwnerStatistics"
import EventPage from "./components/events-booking/EventPage"
import EventForm from "./components/events-booking/EventForm"
import OwnerEventsAndPromos from "./components/OwnerEventsAndPromos"
import Events from "./components/events-booking/Events"
import MembersEvents from "./components/events-booking/MembersEvents"
import RestaurantMenu from "./components/preorder/RestaurantMenu"
import MenuItemForm from "./components/preorder/MenuItemForm"
import KitchenOrders from "./components/staff/KitchenOrders"
import EmailVerificationForm from "./components/authorisation/EmailVerificationForm"
import UnsubscribeEmail from "./components/promotions/UnsubscribeEmail"

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const msg = localStorage.getItem("toastMessage")
    if (msg) {
      toast.info(msg)
      setTimeout(() => {
        localStorage.removeItem("toastMessage")
      }, 100)
    }
  }, [])
  useEffect(() => {
    const savedRole = localStorage.getItem("role")
    const midRegistration = localStorage.getItem("mid-registration")

    if (!savedRole || midRegistration) {
      setLoading(false)
      return
    }

    if (savedRole === "staff") {
      const storedUser = localStorage.getItem("staffUser")
      if (storedUser) setUser(JSON.parse(storedUser))
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const user =
          savedRole === "owner" ? await getOwnerInfo() : await getCustomerInfo()
        if (user.profile) {
          setUser(user)
        }
      } catch (ex) {
        setUser(null)
        throw ex
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
                      { type: "link", path: "/events", name: "Events" },
                      { type: "link", path: "/promotions", name: "Promotions" },
                      { type: "link", path: "/login", name: "Login" },
                      { type: "link", path: "/register", name: "Register" },
                    ]
                  : user.role === "staff"
                  ? [
                      {
                        type: "link",
                        path: "/staff/orders",
                        name: "Manage Ordering",
                      },
                      {
                        type: "link",
                        path: "/staff/control-center",
                        name: "Control Center",
                      },
                    ]
                  : [
                      ...(user.role === "owner"
                        ? [
                            {
                              type: "link",
                              path: "/analytics",
                              name: "Analytics",
                            },
                            {
                              type: "link",
                              path: "/owner/events-promos",
                              name: "Manage Events & Promos",
                            },
                          ]
                        : [
                            { type: "link", path: "/events", name: "Events" },
                            {
                              type: "link",
                              path: "/promotions",
                              name: "Promotions",
                            },
                          ]),
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
            path="complete-signup/:googleSignupRole"
            element={<RegisterForm user={user} googleAuth={true} />}
          />
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

          <Route
            path="restaurants"
            element={
              loading ? (
                <LoadingSpinner />
              ) : user && user.role === "owner" ? (
                <OwnerRestaurants user={user} />
              ) : (
                <Restaurants />
              )
            }
          />
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
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="verify-email" element={<EmailVerificationForm />} />
          <Route path="unsubscribe" element={<UnsubscribeEmail />} />
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
          <Route path="images/:imageUrl" element={<ImageShow />} />
          <Route
            path="online-queue/:restaurantId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<OnlineQueue user={user} />}
              />
            }
          />
          <Route
            path="staff/login"
            element={<StaffLogin user={user} setUser={setUser} />}
          />
          <Route
            path="staff/control-center"
            element={
              <ProtectedStaffRoute
                loading={loading}
                user={user}
                element={<StaffControlCenter user={user} />}
              />
            }
          />
          <Route
            path="staff/orders"
            element={
              <ProtectedStaffRoute
                loading={loading}
                user={user}
                element={<KitchenOrders user={user} />}
              />
            }
          />
          <Route
            path="promotions/new"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<PromotionForm user={user} />}
              />
            }
          />
          <Route path="promotions" element={<Promotions user={user} />} />
          <Route
            path="owner/events-promos"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<OwnerEventsAndPromos user={user} />}
              />
            }
          />
          <Route
            path="promotions/:promotionId"
            element={<PromotionPage user={user} />}
          />
          <Route
            path="promotions/edit/:promotionId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<PromotionForm user={user} />}
              />
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<OwnerStatistics user={user} />}
              />
            }
          />
          <Route
            path="statistics/:restaurantId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<RestaurantPerformance user={user} />}
              />
            }
          />
          <Route
            path="current-rewards/:restaurantId"
            element={<RestaurantRewardsStore user={user} loading={loading} />}
          />
          <Route
            path="rewards/:rewardId"
            element={<RewardPage user={user} />}
          />
          <Route
            path="rewards/:restaurantId/new"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<RewardForm user={user} />}
              />
            }
          />
          <Route
            path="rewards/:restaurantId/edit/:rewardId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<RewardForm user={user} />}
              />
            }
          />
          <Route
            path="my-rewards"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<CustomerRewards user={user} />}
              />
            }
          />
          <Route path="events" element={<Events user={user} />} />
          <Route
            path="member-events/:restaurantId"
            element={<MembersEvents user={user} />}
          />
          <Route path="events/:eventId" element={<EventPage user={user} />} />
          <Route
            path="events/new"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<EventForm user={user} />}
              />
            }
          />
          <Route
            path="events/edit/:eventId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<EventForm user={user} />}
              />
            }
          />
          <Route
            path="pre-order/:restaurantId"
            element={<RestaurantMenu user={user} />}
          />
          <Route
            path="menu-item/new/:restaurantId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<MenuItemForm user={user} />}
              />
            }
          />
          <Route
            path="menu-item/edit/:restaurantId/:itemId"
            element={
              <ProtectedRoute
                loading={loading}
                user={user}
                element={<MenuItemForm user={user} />}
              />
            }
          />
          <Route path="not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Fragment>
  )
}

export default App
