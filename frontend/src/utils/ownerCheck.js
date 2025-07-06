export const userIsOwner = (user) => {
    return user.role === "owner"
}

export const ownedByUser = (restaurant, user) => {
//    return user?.role === "owner" && user?.profile?.restaurants.some(
//         (r) => r._id === restaurantId
//     )
    return restaurant?.owner === user?._id
}