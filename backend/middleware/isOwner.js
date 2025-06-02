module.exports = function (req, res, next) { 
  if (req.user.role != "owner") return res.status(403).send('Access denied: Only owners allowed');
  next();
}