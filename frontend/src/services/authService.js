import { sanitizeStrings } from '@/utils/stringSanitizer';
import http from './httpService'

const apiEndpoint = import.meta.env.VITE_API_URL + "/auth"

function isValidEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
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
    const { data } = await http.post(apiEndpoint, sanitized)
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