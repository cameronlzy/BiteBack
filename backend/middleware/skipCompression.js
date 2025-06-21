export default function (req, res, next) {
  res.set('x-no-compression', 1);
  next();
}
