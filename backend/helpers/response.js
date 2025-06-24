export function error(status, message) {
  return {
    status,
    body: { error: message }
  };
}

export function success(data, status = 200) {
  return {
    status,
    body: data
  };
}

export function wrapError(message) {
  return { error: message };
}