export default function skipHelmet(req, res, next) {
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('X-Content-Type-Options');
  res.removeHeader('X-DNS-Prefetch-Control');
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Strict-Transport-Security');
  res.removeHeader('X-Download-Options');
  res.removeHeader('X-Permitted-Cross-Domain-Policies');
  res.removeHeader('Referrer-Policy');
  next();
}
