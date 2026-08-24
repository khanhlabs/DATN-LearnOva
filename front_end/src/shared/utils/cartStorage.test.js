// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api-client/AxiosClient', () => ({ default: {} }))
vi.mock('../../features/cart/infrastructure/api/CartApi', () => ({
  addCartItemApi: vi.fn(),
  getMyCartApi: vi.fn(),
  mergeCartApi: vi.fn(),
}))

import {
  CART_UPDATED_EVENT,
  addStoredCartItem,
  clearStoredCartItems,
  getStoredCartCourseIds,
  getStoredCartItems,
  mapCartApiItem,
  removeStoredCartItem,
  setStoredCartItems,
} from './cartStorage'

describe('guest cart storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('adds a course once and notifies listeners', () => {
    const listener = vi.fn()
    window.addEventListener(CART_UPDATED_EVENT, listener)

    const result = addStoredCartItem({
      courseId: 12,
      title: 'React cơ bản',
      teacher: 'LearnOva',
      price: 199000,
    })

    expect(result.alreadyInCart).toBe(false)
    expect(getStoredCartCourseIds()).toEqual([12])
    expect(listener).toHaveBeenCalledTimes(1)
    expect(addStoredCartItem({ courseId: 12 }).alreadyInCart).toBe(true)
    window.removeEventListener(CART_UPDATED_EVENT, listener)
  })

  it('removes and clears stored courses safely', () => {
    addStoredCartItem({ courseId: 12, title: 'React' })
    addStoredCartItem({ courseId: 13, title: 'Java' })

    expect(removeStoredCartItem(12).map((item) => item.courseId)).toEqual([13])
    expect(clearStoredCartItems()).toEqual([])
    expect(getStoredCartItems()).toEqual([])
  })

  it('reads legacy id fields as course ids', () => {
    window.localStorage.setItem('learnova_cart_items', JSON.stringify([{ id: '7' }, { courseId: 8 }, { id: 'none' }]))

    expect(getStoredCartCourseIds()).toEqual([7, 8])
  })

  it('returns an empty cart when local storage is invalid JSON', () => {
    window.localStorage.setItem('learnova_cart_items', '{invalid-json')

    expect(getStoredCartItems()).toEqual([])
  })

  it('stores an empty cart when the supplied value is not an array', () => {
    expect(setStoredCartItems(null)).toEqual([])
    expect(getStoredCartItems()).toEqual([])
  })

  it('keeps all items when removing a course that is not present', () => {
    addStoredCartItem({ courseId: 12, title: 'React' })

    expect(removeStoredCartItem(99).map((item) => item.courseId)).toEqual([12])
  })

  it('maps an API cart item to the UI cart shape', () => {
    expect(mapCartApiItem({ courseId: 12, title: 'React', teacher: 'LearnOva', price: 199000, image: 'react.png' }))
      .toEqual({ id: 12, courseId: 12, title: 'React', teacher: 'LearnOva', price: 199000, image: 'react.png', qty: 1 })
  })
})
