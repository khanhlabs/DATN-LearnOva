// Backend daily-aggregate queries only return rows for days that actually had activity,
// so sparse data (e.g. 2 completions 20 days apart) gets rendered as a straight line
// connecting those 2 points across the whole chart width, looking like sustained
// activity instead of near-zero activity with occasional spikes. This fills in the
// missing days with 0 so line/area charts reflect the real day-by-day shape.
export const fillDailySeries = (points, { days = 30, dayKey = "day", valueKey = "amount", endDate } = {}) => {
  const byDay = new Map(points.map((p) => [String(p[dayKey]), p[valueKey]]));
  const end = endDate ? new Date(endDate) : new Date();

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ [dayKey]: key, [valueKey]: byDay.get(key) ?? 0 });
  }
  return result;
};
