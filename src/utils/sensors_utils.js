export function round(n) {
  if (!n) {
    return 0;
  }
  return Math.floor(n * 100) / 100;
}

export function degree(deg) {
  deg = deg % 360;
  if (deg < 0) deg += 360;
  return deg;
}

export function compFilter(value1, value2, prev = 0, alpha = 0.95) {
  return alpha * (prev + value1) + (1 - alpha) * value2;
}
