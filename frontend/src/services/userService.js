import http from './httpService'

const apiEndpoint = import.meta.env.VITE_API_URL + "/auth"


export async function saveCustomer(customer) {
   if(customer._id) {
            const body = {...customer}
            delete body._id;
            return await http.put(import.meta.env.VITE_API_URL + "/customers/me", body) 
   } else {
        return await http.post(apiEndpoint + "/register/customer", customer)
   }
}

export async function saveOwner(owner) {
    if(owner._id) {
            const body = {...owner}
            delete body._id;
            return await http.put(import.meta.env.VITE_API_URL + "/owners/me", body) 
   } else {
        return await http.post(apiEndpoint + "/register/owner", owner)
   }
}

export async function getGeneralUserInfo(userId) {
     const { data } = await http.get(import.meta.env.VITE_API_URL + `/customers/${userId}`)
     return data
}
