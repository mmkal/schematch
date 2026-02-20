import {match as tspmatch} from 'ts-pattern'
import {describe, expect, it} from 'vitest'
import {type} from 'arktype'
import * as v from 'valibot'
import {z} from 'zod'

import {match} from '../../src/index.js'
import type {StandardSchemaV1} from '../../src/index.js'

describe('high-level/basic-usage', () => {
  it('matches standard-schema libraries in order', () => {
    const stringResult = match('hello')
      .case(z.string(), s => `hello ${s.substring(1, 3)}`)
      .case(v.array(v.number()), arr => `got ${arr.length} numbers`)
      .case(type({msg: 'string'}), obj => obj.msg)
      .default(() => 'unexpected')

    expect(stringResult).toBe('hello el')

    const arrayResult = match([1, 2, 3])
      .case(z.string(), s => `hello ${s.substring(1, 3)}`)
      .case(v.array(v.number()), arr => `got ${arr.length} numbers`)
      .case(type({msg: 'string'}), obj => obj.msg)
      .default(() => 'unexpected')

    expect(arrayResult).toBe('got 3 numbers')

    const objectResult = match({msg: 'yo'})
      .case(z.string(), s => `hello ${s.substring(1, 3)}`)
      .case(v.array(v.number()), arr => `got ${arr.length} numbers`)
      .case(type({msg: 'string'}), obj => obj.msg)
      .default(() => 'unexpected')

    expect(objectResult).toBe('yo')

    const fallbackResult = match(42)
      .case(z.string(), s => `hello ${s.substring(1, 3)}`)
      .case(v.array(v.number()), arr => `got ${arr.length} numbers`)
      .case(type({msg: 'string'}), obj => obj.msg)
      .default(() => 'unexpected')

    expect(fallbackResult).toBe('unexpected')
  })

  it("rahul idea", () => {
    const myMatcher = match
      .case(z.string(), s => `hello ${s.substring(1, 3)}`)
      .case(v.array(v.number()), arr => `got ${arr.length} numbers`)
      .case(type({msg: 'string'}), obj => obj.msg)
      .default(() => 'unexpected')

    // type exhaustiveness via .default<never>(match.throw):
    // const myMatcher2 = match
    //   .case(z.string(), s => `hello ${s.substring(1, 3)}`)
    //   .case(v.array(v.number()), arr => `got ${arr.length} numbers`)
    //   .case(type({msg: 'string'}), obj => obj.msg)
    //   .default<never>(match.throw)
    // => (input: string | number[] | {msg: string}) => string

    expect(myMatcher('hello')).toBe('hello el')
    expect(myMatcher([1, 2, 3])).toBe('got 3 numbers')
    expect(myMatcher({msg: 'yo'})).toBe('yo')
    expect(myMatcher(42)).toBe('unexpected')
  })

  it('passes matched value first and narrowed input second', () => {
    type OpencodeEvent =
      | {type: 'session.status'; sessionId: string}
      | {type: 'message.updated'; properties: {sessionId: string}}

    const getSessionId = match
      .input<OpencodeEvent>()
      .case(z.object({type: z.literal('session.status')}), (parsed, input) => {
        expect(parsed.type).toBe('session.status')
        return input.sessionId
      })
      .case(z.object({type: z.literal('message.updated')}), (parsed, input) => {
        expect(parsed.type).toBe('message.updated')
        return input.properties.sessionId
      })
      .default(match.throw)

    expect(getSessionId({type: 'session.status', sessionId: 'abc'})).toBe('abc')
    expect(getSessionId({type: 'message.updated', properties: {sessionId: 'xyz'}})).toBe('xyz')
  })

  it('supports .at(key) convenience for discriminated unions', () => {
    type OpencodeEvent =
      | {type: 'session.status'; sessionId: string}
      | {type: 'message.updated'; properties: {sessionId: string}}

    const getSessionId = match
      .input<OpencodeEvent>()
      .at('type')
      .case('session.status', value => value.sessionId)
      .case('message.updated', value => value.properties.sessionId)
      .default(match.throw)

    expect(getSessionId({type: 'session.status', sessionId: 'abc'})).toBe('abc')
    expect(getSessionId({type: 'message.updated', properties: {sessionId: 'xyz'}})).toBe('xyz')
  })


  it('narrows remaining fields automatically when matching by discriminator key', () => {
    type HttpResponse =
      | {status: 'success'; code: 200; data: {message: string}}
      | {status: 'error'; code: 400; data: {error: string}}
      | {status: 'pending'; code: 102; data: {retryAfter: number}}
      | {status: 'not_found'; code: 404; data: {resource: string}}

    const responses: HttpResponse[] = [
      {status: 'success', code: 200, data: {message: 'OK'}},
      {status: 'error', code: 400, data: {error: 'Bad request'}},
      {status: 'pending', code: 102, data: {retryAfter: 30}},
      {status: 'not_found', code: 404, data: {resource: 'post'}},
    ]

    const toTemp = match
      .input<HttpResponse>()
      .at('status')
      .case('success', r => ({type: 'done' as const, message: r.data.message}))
      .case('error', r => ({type: 'fail' as const, reason: r.data.error}))
      .case('pending', r => ({type: 'waiting' as const, seconds: r.data.retryAfter}))
      .case('not_found', r => ({type: 'missing' as const, what: r.data.resource}))
      .exhaustive()

    const tempObjects = responses.map(resp => toTemp(resp))

    expect(tempObjects).toEqual([
      {type: 'done', message: 'OK'},
      {type: 'fail', reason: 'Bad request'},
      {type: 'waiting', seconds: 30},
      {type: 'missing', what: 'post'},
    ])
  })

  it('uses schema output values in handlers', () => {
    const ParseNumber: StandardSchemaV1<unknown, number> = {
      '~standard': {
        version: 1,
        vendor: 'example',
        validate: value =>
          typeof value === 'string'
            ? {value: Number.parseInt(value, 10)}
            : {issues: [{message: 'Expected a string'}]},
      },
    }

    const result = match('41')
      .case(ParseNumber, (parsed, input) => {
        expect(parsed).toBe(41)
        expect(input).toBe('41')
        return parsed + 1
      })
      .default(() => 0)

    expect(result).toBe(42)
  })
})
