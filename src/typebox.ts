import * as Typebox from 'typebox'
import type {Static, TScript} from 'typebox'
import type {TLocalizedValidationError} from 'typebox/error'
import {Compile} from 'typebox/schema'

import type {StandardSchemaV1} from './standard-schema/contract.js'
import {
  createMatchFactory,
  type AtCaseInput,
  type AtCaseValues,
  type MatchExpression,
  type MatchFactory,
  type NarrowedOutput,
  type ReusableMatcher,
  type ReusableMatcherAt,
  type Unset,
  type WithReturn,
} from './match.js'
import type {InferInput, InferOutput} from './types.js'

export type TypeboxScriptValue<script extends string> = Static<TScript<{}, script>>

export type TypeboxNarrowedValue<input, script extends string> =
  IsUnion<input> extends true
    ? [Extract<input, TypeboxScriptValue<script>>] extends [never]
      ? TypeboxScriptValue<script>
      : Extract<input, TypeboxScriptValue<script>>
    : TypeboxScriptValue<script>

type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : false

export type TypeboxMatchFactory = Omit<MatchFactory, 'case' | 'input' | 'output'> & {
  <const input, output = Unset>(value: input): TypeboxMatchExpression<input, output>
  input<input>(): TypeboxReusableMatcher<input, Unset>
  output<output>(): TypeboxReusableMatcher<unknown, output>
  case<input, script extends string, result>(
    script: script,
    handler: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => result
  ): TypeboxReusableMatcher<input, WithReturn<Unset, result>, TypeboxScriptValue<script>>
  case<input, script extends string, result>(
    script: script,
    predicate: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => unknown,
    handler: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => result
  ): TypeboxReusableMatcher<input, WithReturn<Unset, result>, TypeboxScriptValue<script>>
  case<input, schema extends StandardSchemaV1, result>(
    schema: schema,
    handler: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => result
  ): TypeboxReusableMatcher<input, WithReturn<Unset, result>, InferInput<schema>>
  case<input, schema extends StandardSchemaV1, result>(
    schema: schema,
    predicate: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => unknown,
    handler: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => result
  ): TypeboxReusableMatcher<input, WithReturn<Unset, result>, InferInput<schema>>
  case<input, schemas extends readonly [StandardSchemaV1, ...StandardSchemaV1[]], result>(
    ...args: [...schemas, (parsed: InferOutput<schemas[number]>, input: input) => result]
  ): TypeboxReusableMatcher<input, WithReturn<Unset, result>, InferInput<schemas[number]>>
}

export type TypeboxMatchExpression<input, output, CaseInputs = never> =
  Omit<MatchExpression<input, output, CaseInputs>, 'case' | 'when' | 'output' | 'returnType' | 'narrow'> & {
    case<script extends string, result>(
      script: script,
      handler: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => result
    ): TypeboxMatchExpression<input, WithReturn<output, result>, CaseInputs | TypeboxScriptValue<script>>
    case<script extends string, result>(
      script: script,
      predicate: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => unknown,
      handler: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => result
    ): TypeboxMatchExpression<input, WithReturn<output, result>, CaseInputs | TypeboxScriptValue<script>>
    case<schema extends StandardSchemaV1, result>(
      schema: schema,
      handler: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => result
    ): TypeboxMatchExpression<input, WithReturn<output, result>, CaseInputs | InferInput<schema>>
    case<schema extends StandardSchemaV1, result>(
      schema: schema,
      predicate: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => unknown,
      handler: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => result
    ): TypeboxMatchExpression<input, WithReturn<output, result>, CaseInputs | InferInput<schema>>
    case<schemas extends readonly [StandardSchemaV1, ...StandardSchemaV1[]], result>(
      ...args: [...schemas, (parsed: InferOutput<schemas[number]>, input: input) => result]
    ): TypeboxMatchExpression<input, WithReturn<output, result>, CaseInputs | InferInput<schemas[number]>>
    when<result>(
      predicate: (value: input) => unknown,
      handler: (value: input, input: input) => result
    ): TypeboxMatchExpression<input, WithReturn<output, result>, CaseInputs>
    output<O>(): TypeboxMatchExpression<input, O, CaseInputs>
    returnType(): TypeboxMatchExpression<input, output, CaseInputs>
    narrow(): TypeboxMatchExpression<input, output, CaseInputs>
  }

export type TypeboxReusableMatcher<input, output, CaseInputs = never> =
  Omit<ReusableMatcher<input, output, CaseInputs>, 'case' | 'when' | 'output' | 'at'> & {
    case<script extends string, result>(
      script: script,
      handler: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => result
    ): TypeboxReusableMatcher<input, WithReturn<output, result>, CaseInputs | TypeboxScriptValue<script>>
    case<script extends string, result>(
      script: script,
      predicate: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => unknown,
      handler: (parsed: TypeboxScriptValue<script>, input: TypeboxNarrowedValue<input, script>) => result
    ): TypeboxReusableMatcher<input, WithReturn<output, result>, CaseInputs | TypeboxScriptValue<script>>
    case<schema extends StandardSchemaV1, result>(
      schema: schema,
      handler: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => result
    ): TypeboxReusableMatcher<input, WithReturn<output, result>, CaseInputs | InferInput<schema>>
    case<schema extends StandardSchemaV1, result>(
      schema: schema,
      predicate: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => unknown,
      handler: (parsed: InferOutput<schema>, input: NarrowedOutput<input, schema>) => result
    ): TypeboxReusableMatcher<input, WithReturn<output, result>, CaseInputs | InferInput<schema>>
    case<schemas extends readonly [StandardSchemaV1, ...StandardSchemaV1[]], result>(
      ...args: [...schemas, (parsed: InferOutput<schemas[number]>, input: input) => result]
    ): TypeboxReusableMatcher<input, WithReturn<output, result>, CaseInputs | InferInput<schemas[number]>>
    when<result>(
      predicate: (value: input) => unknown,
      handler: (value: input, input: input) => result
    ): TypeboxReusableMatcher<input, WithReturn<output, result>, CaseInputs>
    output<O>(): TypeboxReusableMatcher<input, O, CaseInputs>
    at<key extends PropertyKey>(key: key): TypeboxReusableMatcherAt<input, output, CaseInputs, key>
  }

export type TypeboxReusableMatcherAt<input, output, CaseInputs = never, key extends PropertyKey = PropertyKey> =
  Omit<ReusableMatcherAt<input, output, CaseInputs, key>, 'case' | 'when' | 'output'> & {
    case<value extends AtCaseValues<input, key>, result>(
      value: value,
      handler: (value: AtCaseInput<input, key, value>) => result
    ): TypeboxReusableMatcherAt<input, WithReturn<output, result>, CaseInputs | AtCaseInput<input, key, value>, key>
    when<result>(
      predicate: (value: input) => unknown,
      handler: (value: input, input: input) => result
    ): TypeboxReusableMatcherAt<input, WithReturn<output, result>, CaseInputs, key>
    output<O>(): TypeboxReusableMatcherAt<input, O, CaseInputs, key>
  }

const fastCheckSymbol = Symbol.for('schematch.fast-check')
const schemaCache = new Map<string, StandardSchemaV1>()

export const typeboxScriptToStandardSchema = (schema: unknown): StandardSchemaV1 => {
  if (typeof schema !== 'string') return schema as StandardSchemaV1

  const cached = schemaCache.get(schema)
  if (cached) return cached

  const type = Typebox.Script(schema)
  let validator: ReturnType<typeof Compile> | null = null
  const getValidator = () => {
    if (!validator) validator = Compile(type)
    return validator
  }

  const standardSchema = {
    '~standard': {
      version: 1,
      vendor: 'schematch:typebox',
      validate: (value: unknown) => {
        const compiled = getValidator()
        if (compiled.Check(value)) return {value}
        return {issues: validationIssues(compiled, value)}
      },
    },
    [fastCheckSymbol]: (value: unknown) => getValidator().Check(value),
    typebox: {script: schema, type},
  } satisfies StandardSchemaV1 & Record<PropertyKey, unknown>

  schemaCache.set(schema, standardSchema)
  return standardSchema
}

const validationIssues = (
  validator: ReturnType<typeof Compile>,
  value: unknown
): StandardSchemaV1.Issue[] => {
  const [_result, validationErrors] = validator.Errors(value)

  return validationErrors.map(error => ({
    message: error.message,
    path: pathSegments(error),
  }))
}

const pathSegments = (error: TLocalizedValidationError): PropertyKey[] => {
  if (!error.instancePath) return []
  return error.instancePath
    .slice(1)
    .split('/')
    .map(segment => segment.split('~1').join('/').split('~0').join('~'))
}

export const match = createMatchFactory(typeboxScriptToStandardSchema) as unknown as TypeboxMatchFactory
