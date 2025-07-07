export const getCardMessageFromDescription = (desc) => {
  if (!desc) return ""

  const match = desc.match(/^.*?\.(?=\s+[A-Z])/)
  return match ? match[0].trim() : desc.trim()
}

export const getShortAddress = (address) => {
  if (!address) return ""
  const index = address.indexOf(",")
  return index !== -1 ? address.slice(0, index).trim() : address.trim()
}