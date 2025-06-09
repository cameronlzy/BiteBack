import { sanitizeStrings } from '@/utils/stringSanitizer'
import http from './httpService'

const customerApiEndpoint = import.meta.env.VITE_API_URL + "/customers"
const ownerApiEndpoint = import.meta.env.VITE_API_URL + "/owners"


export async function saveCustomer(customer, isUpdate) {
     const sanitized = sanitizeStrings(customer)
   if(isUpdate) {
        return await http.patch(customerApiEndpoint + "/me", sanitized) 
   } else {
        return await http.post(import.meta.env.VITE_API_URL + "/auth/register/customer", sanitized)
   }
}

export async function saveOwner(owner, isUpdate) {
    const sanitized = sanitizeStrings(owner)
    if(isUpdate) {
        return await http.patch(ownerApiEndpoint + "/me", sanitized) 
   } else {
        return await http.post(import.meta.env.VITE_API_URL + "/auth/register/owner", sanitized)
   }
}

export async function getGeneralCustomerInfo(customerId) {
     const { data } = await http.get(customerApiEndpoint + `/${customerId}`)
     return data
}

export async function changePassword(newPasswordObj, role) {
     return role === "owner" 
    ? await http.patch(ownerApiEndpoint + "/me", newPasswordObj) 
    : await http.patch(customerApiEndpoint + "/me", newPasswordObj)
}

export async function getOwnerInfo() {
  const response = await http.get(ownerApiEndpoint + "/me")
  return response.data;
}

export async function getCustomerInfo() {
    const response = await http.get(customerApiEndpoint + "/me")
    return response.data
}

export async function deleteAccount(confirmation, role) {
  const url = role === "owner" 
    ? `${ownerApiEndpoint}/me`
    : `${customerApiEndpoint}/me`

  return await http.request({
    url,
    method: "DELETE",
    data: confirmation,
  })
}
