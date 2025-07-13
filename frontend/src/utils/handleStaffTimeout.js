import auth from "@/services/authService"

export const handle401 = async (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem("role")
    localStorage.removeItem("staffUser")
    localStorage.removeItem("restaurant")
    await auth.logout()
    localStorage.setItem("toastMessage","Session expired. Please re-login.", {
      toastId: "sessionStaffExpiry"
    })
    window.location = "/staff/login"
    return true
  }
  return false
}