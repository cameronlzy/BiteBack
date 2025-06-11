export const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
};

export const setTokenCookie = (t) => {
  return `token=${t}; HttpOnly`;
};
