export default function (req, res, next) { 
  if (req.user.role != "customer") return res.status(403).send('Access denied: Only customers allowed');
  next();
}