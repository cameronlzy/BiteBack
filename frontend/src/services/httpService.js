import axios from "axios"
import { log } from "@/services/logService"
import { toast } from "react-toastify"

const ignoreUnauthorisedRoutes = [
    "/register",
    "/verify-email",
    "/complete-signup"
]

axios.defaults.withCredentials = true;

axios.interceptors.response.use(null, (error) => {
    const expectedError = error.response && error.response.status >= 400 && error.response.status < 500

    if(!expectedError) {
        log(error)
        toast.error("Unexpected error occured")
    }

    if (error.response?.status === 401) {
    const path = window.location.pathname;

    const isIgnored = ignoreUnauthorisedRoutes.some(route =>
        path.startsWith(route)
    );

    if (!isIgnored) {
        localStorage.removeItem("role");
        toast.error("Session expired. Please log in again.", {
            toastId: "sessionExpiry"
        });
        window.location.href = "/login";
    }
}
    return Promise.reject(error);
})

// function setJwt(jwt) {
//     // axios.defaults.headers.common["Authorization"] = `Bearer ${jwt}`
//     axios.defaults.headers.common["x-auth-token"] = jwt
// }

export default {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: (url, data) => axios.delete(url, { data }),
    patch: axios.patch,
    request: axios.request
}