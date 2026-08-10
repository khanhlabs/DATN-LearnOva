export const buildLinePoints = (values, width = 720, height = 230, maxValue) => {
  const effectiveMax = maxValue ?? Math.max(...values, 0);
  const safeMax = effectiveMax > 0 ? effectiveMax : 1;
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / safeMax) * (height - 18);
      return `${x},${y}`;
    })
    .join(" ");
};
