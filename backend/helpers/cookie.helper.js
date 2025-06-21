export const setAuthCookie = (res, token, timeInHours = 1) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 60 * 60 * 1000 * timeInHours
  });
};

export const setTokenCookie = (t) => {
  return `token=${t}; HttpOnly`;
};
