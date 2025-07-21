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

export async function verifyEmail(token) {
    const { data } = await http.post(apiEndpoint + "/verify-email", {
        token
    })
    return data 
}

export async function resendVerificationEmail(email) {
    const { data } = await http.post(apiEndpoint + "/resend-verification", {
        email
    })
    return data
}

export async function openGooglePopup(role = 'customer') {
  return new Promise((resolve, reject) => {
    const width = 500
    const height = 600
    const left = (window.screen.width / 2) - (width / 2)
    const top = (window.screen.height / 2) - (height / 2)

    const popup = window.open(
      `/api/auth/google?role=${role}`,
      'GoogleLogin',
      `width=${width},height=${height},top=${top},left=${left}`
    )

    if (!popup) return reject(new Error('Popup blocked'))

    const allowedOrigins = [
      window.location.origin,
      'https://biteback1-555cc0fda71c.herokuapp.com'
    ]

    const handleMessage = async (event) => {
      if (!allowedOrigins.includes(event.origin)) return

      const { status, isNewUser, tempToken  } = event.data || {}

      if (status === 'success') {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        
        await tokenExchange(tempToken)

        setTimeout(() => {
            if (isNewUser) {
                window.location.href = `/complete-signup/${role || 'customer'}`
            } else {
                window.location.reload()
            }
        }, 300)


        resolve()
      }
    }

    window.addEventListener('message', handleMessage)

    const checkClosed = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', handleMessage)
          reject(new Error('Popup closed by user'))
        }
      } catch {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        reject(new Error('Popup inaccessible or blocked'))
      }
    }, 500)
  })
}

export async function tokenExchange(token) {
    const { data } = await http.post(apiEndpoint + "/consume-token", {token})
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
     return await http.post(apiEndpoint + "/reset-password", {...newPasswordObj, token})
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