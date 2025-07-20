import { sanitizeStrings } from '@/utils/stringSanitizer';
import http from './httpService'

const apiEndpoint = import.meta.env.VITE_API_URL + "/auth"
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

async function login(user) {
    const finalUser = isValidEmail(user.identifier) ? {
        email: user.identifier,
        password: user.password
    } : {
        username: user.identifier,
        password: user.password
    }
    const response = await http.post(apiEndpoint + "/login", finalUser)
    return response.data
}

export async function register(user) {
    const sanitized = sanitizeStrings(user)
    const { data } = await http.post(apiEndpoint + "/register", sanitized)
    return data
}

export async function verifyEmail(verificationCode) {
    const { data } = await http.post(apiEndpoint + `/verify-email/${verificationCode}`)
    return data 
}

export async function resendVerificationEmail(email) {
    const { data } = await http.post(apiEndpoint + "/resend-verification", {
        email
    })
    return data
}

export async function getGoogleRedirect(role) {
    const { data } = await http.get(`${apiEndpoint}/google?role=${role}`)
    return data
}

export async function setCredentials(payload) {
    const { data } = await http.post(apiEndpoint + "/set-credentials", payload)
    return data
}

async function logout() {
    await http.post(apiEndpoint + "/logout", null)
    localStorage.removeItem("role")
}

async function resetPasswordTrigger(userDetails) {
    const identifierObj = isValidEmail(userDetails.identifier) ? {
        email: userDetails.identifier
     } : {
        username: userDetails.identifier
     }
     return await http.post(apiEndpoint + "/forget-password", identifierObj)
}

async function resetPasswordSubmit(token, newPasswordObj) {
     return await http.post(apiEndpoint + `/reset-password/${token}`, newPasswordObj)
}

async function changePassword(newPasswordObj) {
    const { data } = await http.put(apiEndpoint + "/change-password", newPasswordObj)
    return data
}


export default {
    logout,
    login,
    resetPasswordSubmit,
    resetPasswordTrigger,
    changePassword
}