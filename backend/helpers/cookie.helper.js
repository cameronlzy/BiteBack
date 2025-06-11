exports.setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
};

exports.setTokenCookie = (t) => {
    return `token=${t}; HttpOnly`;
};