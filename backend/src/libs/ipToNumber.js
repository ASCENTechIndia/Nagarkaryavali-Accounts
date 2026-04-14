function ipToNumber(ip) {
  if (!ip) return 0;

  // remove IPv6 prefix if present
  ip = ip.replace("::ffff:", "").trim();

  // only support IPv4 for numeric conversion
  const parts = ip.split(".");
  if (parts.length !== 4) return 0;

  const nums = parts.map((x) => Number(x));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return 0;

  // unsigned 32-bit integer
  return ((nums[0] << 24) >>> 0) + (nums[1] << 16) + (nums[2] << 8) + nums[3];
}

module.exports = { ipToNumber };
