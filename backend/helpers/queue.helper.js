exports.findQueueGroup = (pax) => {
  if (pax >= 1 && pax <= 2) return 'small';
  if (pax >= 3 && pax <= 4) return 'medium';
  if (pax >= 5) return 'large';
};
