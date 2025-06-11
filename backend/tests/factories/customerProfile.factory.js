import CustomerProfile from '../../models/customerProfile.model.js';

export function createTestCustomerProfile(user = null) {
    const contactNumber = 98765432;
    const name =  `test_${Date.now()}`;
    const favCuisines = ['Chinese'];
    let username;
    if (!user) {
        username = `user_${Date.now()}`;
    } else {
        username = user.username;
    }

    const profile = new CustomerProfile({
        user: user._id,
        name, username, contactNumber, favCuisines
    });
    return profile;
}