import Cookies from "js-cookie"

export const setAuthCookie = async (token, timeInHours = 1) => {
  Cookies.set("token", token, {
    expires: timeInHours / 24,
    secure: true,
    sameSite: "None",
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
}