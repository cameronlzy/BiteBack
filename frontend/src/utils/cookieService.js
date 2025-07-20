import Cookies from "js-cookie"

export const setAuthCookie = (token, timeInHours = 1) => {
  Cookies.set("token", token, {
    expires: timeInHours / 24, 
    secure: true,
    sameSite: "None",
  })
}