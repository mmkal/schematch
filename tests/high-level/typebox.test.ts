import * as Typebox from 'typebox'
import {expect, expectTypeOf, it} from 'vitest'

import {match} from '../../src/index.js'

match.typebox(Typebox)

it('uses TypeBox Script strings as reusable matcher input types', () => {
  const matcher = match
    .case(`string`, value => value.substring(2, 4))
    .case(`[number, number]`, ([x, y]) => `total: ${x + y}`)
    .default<never>(match.throw)

    expect(matcher('hello')).toBe('ll')
    expect(matcher([1, 2])).toBe('total: 3')

    expectTypeOf(matcher).toEqualTypeOf<(input: string | [number, number]) => string>()    
})

it('reports TypeBox validation errors on match failures', () => {
  const matcher = match
    .case(`{ foo: string; bar: number }`, () => 'matched')
    .default(match.throw)

  expect(() => matcher({foo: 'score: ', bar: 'nope'})).toThrow(/must be number/)
})

it('matches TypeBox Script strings in reusable matchers', () => {
  const matcher = match
    .case(`string`, value => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return value.substring(2, 4)
    })
    .case(`[number, number]`, value => {
      expectTypeOf(value).toEqualTypeOf<[number, number]>()
      const [x, y] = value
      return `total: ${x + y}`
    })
    .case(`{ foo: string; bar: number }`, value => {
      expectTypeOf(value).toEqualTypeOf<{foo: string; bar: number}>()
      return value.foo + value.bar.toFixed(2)
    })
    .default(() => 'fallback')

  expect(matcher('hello')).toBe('ll')
  expect(matcher([1, 2])).toBe('total: 3')
  expect(matcher({foo: 'score: ', bar: 1.5})).toBe('score: 1.50')
  expect(matcher({foo: 'score: ', bar: 'nope'})).toBe('fallback')
})

it('matches TypeBox Script strings in inline match expressions', () => {
  const result = match({foo: 'score: ', bar: 1.5} as unknown)
    .case(`string`, value => {
      expectTypeOf(value).toEqualTypeOf<string>()
      return value.substring(2, 4)
    })
    .case(`{ foo: string; bar: number }`, value => {
      expectTypeOf(value).toEqualTypeOf<{foo: string; bar: number}>()
      return value.foo + value.bar.toFixed(2)
    })
    .default(() => 'fallback')

  expect(result).toBe('score: 1.50')
})
