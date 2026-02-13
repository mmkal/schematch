import {describe, expect, it} from 'vitest'

import {match} from '../../src/index.js'
import {makeAsyncSchema, makeSchema} from '../helpers/standard-schema.js'

describe('high-level/async-usage', () => {
  const AsyncNumber = makeAsyncSchema<number>(
    (value): value is number => typeof value === 'number'
  )

  it('handles async schema validation with defaultAsync', async () => {
    const result = await match(2)
      .case(AsyncNumber, async value => value + 1)
      .defaultAsync(() => 0)

    expect(result).toBe(3)
  })

  it('throws when sync match sees async schema validation', () => {
    expect(() => {
      match(2).case(AsyncNumber, () => 'nope').default('assert')
    }).toThrow('Schema validation returned a Promise. Use .defaultAsync(...) instead.')
  })

  it('throws when a sync guard returns a promise', () => {
    const Number = makeSchema<number>((value): value is number => typeof value === 'number')

    expect(() => {
      match(2).case(Number, async () => true, () => 'nope').default('assert')
    }).toThrow('Guard returned a Promise. Use .defaultAsync(...) instead.')
  })

  it('supports .at(key) convenience with defaultAsync', async () => {
    type Event =
      | {type: 'session.status'; sessionId: string}
      | {type: 'message.updated'; properties: {sessionId: string}}

    const matcher = match
      .input<Event>()
      .at('type')
      .case('session.status', async value => value.sessionId)
      .case('message.updated', async value => value.properties.sessionId)
      .defaultAsync('assert')

    await expect(matcher({type: 'session.status', sessionId: 'abc'})).resolves.toBe('abc')
    await expect(matcher({type: 'message.updated', properties: {sessionId: 'xyz'}})).resolves.toBe('xyz')
  })
})
