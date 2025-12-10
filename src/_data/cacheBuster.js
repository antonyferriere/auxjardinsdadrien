module.exports = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const version = [
    now.getUTCFullYear(),
    pad(now.getUTCMonth() + 1),
    pad(now.getUTCDate()),
    pad(now.getUTCHours()),
    pad(now.getUTCMinutes()),
    pad(now.getUTCSeconds()),
  ].join('');

  return {
    version,
    query: `?v=${version}`,
  };
};
