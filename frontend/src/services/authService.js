import http from './httpService'

const apiEndpoint = import.meta.env.VITE_API_URL + "/auth"

function isValidEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

async function login(user) {
    console.log(user)
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


async function getOwnerInfo() {
  const response = await http.get(import.meta.env.VITE_API_URL + "/owners/me")
  return response.data;
}

async function getCustomerInfo() {
    const response = await http.get(import.meta.env.VITE_API_URL + "/customers/me")
    return response.data
}

async function logout() {
    await http.post(apiEndpoint + "/logout", null)
    localStorage.removeItem("role")
}

export default {
    logout,
    login,
    getCustomerInfo,
    getOwnerInfo,
}