import axios from "axios"
import { log } from "@/services/logService"
import { toast } from "react-toastify"

axios.defaults.withCredentials = true;

axios.interceptors.response.use(null, (error) => {
    const expectedError = error.response && error.response.status >= 400 && error.response.status < 500

    if(!expectedError) {
        log(error)
        toast.error("Unexpected error occured")
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
    delete: axios.delete,
}