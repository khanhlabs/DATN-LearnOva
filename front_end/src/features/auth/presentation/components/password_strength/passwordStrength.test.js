import { describe, expect, it } from 'vitest'
import { getPasswordStrength } from './passwordStrength'

describe('getPasswordStrength', () => {
  it.each([
    [undefined, { level: '', score: 0 }],
    ['', { level: '', score: 0 }],
    ['abc', { level: 'Weak', score: 1 }],
    ['abcdefgh', { level: 'Weak', score: 2 }],
    ['Abcdefgh', { level: 'Medium', score: 3 }],
    ['Abcdefg1', { level: 'Medium', score: 4 }],
    ['Abcdefg1!', { level: 'Strong', score: 5 }],
    ['12345678', { level: 'Weak', score: 2 }],
  ])('classifies password strength for %#', (password, expected) => {
    expect(getPasswordStrength(password)).toEqual(expected)
  })
})
