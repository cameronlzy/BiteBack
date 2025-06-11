const METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'all'];

const asyncWrapper = (handler) =>
  typeof handler === 'function' && handler.constructor.name === 'AsyncFunction'
    ? async function wrappedHandler(req, res, next) {
        try {
          await handler(req, res, next);
        } catch (err) {
          next(err);
        }
      }
    : handler;

export default function wrapRoutes(router) {
  for (const method of METHODS) {
    const original = router[method];

    router[method] = function (path, ...handlers) {
      const wrapped = handlers.map(asyncWrapper);
      return original.call(this, path, ...wrapped);
    };
  }

  return router;
};