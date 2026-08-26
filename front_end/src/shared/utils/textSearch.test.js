import { describe, expect, it } from 'vitest'
import { buildCourseFilterOptions, stripDiacritics } from './textSearch'

describe('stripDiacritics', () => {
  it('makes Vietnamese text searchable without accents', () => {
    expect(stripDiacritics('Nguyễn Đình Độ')).toBe('Nguyen Dinh Do')
  })
})

describe('buildCourseFilterOptions', () => {
  it('keeps unique courses and includes the all-courses option', () => {
    const options = buildCourseFilterOptions(
      [{ courses: [[1, 'Java'], [2, 'React']] }, { courses: [[1, 'Java']] }],
      (item) => item.courses,
    )

    expect(options).toEqual([
      { label: 'Tất cả khóa học', value: 'ALL' },
      { label: 'Java', value: '1' },
      { label: 'React', value: '2' },
    ])
  })

  it.each([
    ['Đặng Thị Đào', 'Dang Thi Dao'],
    ['React 19', 'React 19'],
    ['đĐ', 'dD'],
  ])('normalizes %s', (input, expected) => {
    expect(stripDiacritics(input)).toBe(expected)
  })

  it('keeps the first title when a course id is repeated', () => {
    const options = buildCourseFilterOptions(
      [{ courses: [[1, 'Java cơ bản']] }, { courses: [[1, 'Java nâng cao']] }],
      (item) => item.courses,
    )

    expect(options).toEqual([
      { label: 'Tất cả khóa học', value: 'ALL' },
      { label: 'Java cơ bản', value: '1' },
    ])
  })

  it('returns only the all-courses option for no course data', () => {
    expect(buildCourseFilterOptions([], () => [])).toEqual([
      { label: 'Tất cả khóa học', value: 'ALL' },
    ])
  })
})
