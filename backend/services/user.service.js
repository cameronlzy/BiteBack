const jwt = require('jsonwebtoken');
const config = require('config');

function generateAuthToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profile: user.profile,
    },
    config.get('jwtPrivateKey')
  );
}

module.exports = {
  generateAuthToken,
};
