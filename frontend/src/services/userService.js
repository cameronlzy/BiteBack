import { sanitizeStrings } from '@/utils/stringSanitizer'
import http from './httpService'

const customerApiEndpoint = import.meta.env.VITE_API_URL + "/customers"
const ownerApiEndpoint = import.meta.env.VITE_API_URL + "/owners"

export async function registerCust(customer) {
  const sanitized = sanitizeStrings(customer) 
  const { data } = http.post(customerApiEndpoint, sanitized)
  return data
}

export async function registerOwner(owner) {
  const sanitized = sanitizeStrings(owner) 
  const { data } = http.post(ownerApiEndpoint, sanitized)
  return data
}


export async function updateCustomer(customer) {
     const sanitized = sanitizeStrings(customer)
     return await http.patch(customerApiEndpoint + "/me", sanitized) 
}

export async function updateOwner(owner) {
    const sanitized = sanitizeStrings(owner)
    return await http.patch(ownerApiEndpoint + "/me", sanitized) 
}

export async function getGeneralCustomerInfo(customerId) {
     const { data } = await http.get(customerApiEndpoint + `/${customerId}`)
     return data
}

export async function getOwnerInfo() {
  const response = await http.get(ownerApiEndpoint + "/me")
  return response.data;
}

export async function getCustomerInfo() {
    const response = await http.get(customerApiEndpoint + "/me")
    return response.data
}

export async function getStaffAccounts(ownerPassword) {
  const { data } = await http.post(`${ownerApiEndpoint}/staff/access`, {
    password: ownerPassword,
  })
  return data
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
