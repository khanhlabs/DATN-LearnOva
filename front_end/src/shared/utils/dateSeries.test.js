import { describe, expect, it } from 'vitest'
import { fillDailySeries } from './dateSeries'

describe('fillDailySeries', () => {
  it('fills missing days with zero while preserving reported values', () => {
    const series = fillDailySeries(
      [{ day: '2026-08-17', amount: 4 }, { day: '2026-08-19', amount: 7 }],
      { days: 3, endDate: '2026-08-19T12:00:00.000Z' },
    )

    expect(series).toEqual([
      { day: '2026-08-17', amount: 4 },
      { day: '2026-08-18', amount: 0 },
      { day: '2026-08-19', amount: 7 },
    ])
  })

  it.each([
    ['returns zeros for an empty series', [], { days: 2, endDate: '2026-08-19T12:00:00.000Z' }, [0, 0]],
    ['returns one point when days is one', [{ day: '2026-08-19', amount: 3 }], { days: 1, endDate: '2026-08-19T12:00:00.000Z' }, [3]],
    ['uses the last value for duplicated dates', [{ day: '2026-08-19', amount: 1 }, { day: '2026-08-19', amount: 4 }], { days: 1, endDate: '2026-08-19T12:00:00.000Z' }, [4]],
    ['supports custom day and value keys', [{ date: '2026-08-19', total: 9 }], { days: 1, dayKey: 'date', valueKey: 'total', endDate: '2026-08-19T12:00:00.000Z' }, [9]],
  ])('%s', (_name, points, options, expected) => {
    const series = fillDailySeries(points, options)
    const valueKey = options.valueKey ?? 'amount'

    expect(series.map((point) => point[valueKey])).toEqual(expected)
  })
})
