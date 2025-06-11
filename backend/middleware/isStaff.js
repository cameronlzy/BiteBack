module.exports = function (req, res, next) { 
  if (req.user.role != "staff") return res.status(403).send('Access denied: Only staff allowed');
  next();
}