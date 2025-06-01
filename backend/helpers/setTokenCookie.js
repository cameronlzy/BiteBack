module.exports = function setTokenCookie(t) {
    return `token=${t}; HttpOnly`;
};