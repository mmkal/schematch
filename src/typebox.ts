import {createRequire} from 'node:module'

import type {Static, TSchema, TScript} from 'typebox'
import type {TLocalizedValidationError} from 'typebox/error'
import type * as TypeboxSchema from 'typebox/schema'

import type {StandardSchemaV1} from './standard-schema/contract.js'

type TypeboxScript = <script extends string>(input: script) => TScript<{}, script>

type TypeboxSchemaModule = {
  Compile?: typeof TypeboxSchema.Compile
  default?: {
    Compile?: typeof TypeboxSchema.Compile
  }
}

export type TypeboxModule = {
  Script?: TypeboxScript
  Compile?: typeof TypeboxSchema.Compile
  Schema?: TypeboxSchemaModule
  default?: {
    Script?: TypeboxScript
    Compile?: typeof TypeboxSchema.Compile
    Schema?: TypeboxSchemaModule
  }
}

export type TypeboxScriptValue<script extends string> = Static<TScript<{}, script>>

export type TypeboxNarrowedValue<input, script extends string> =
  IsUnion<input> extends true
    ? [Extract<input, TypeboxScriptValue<script>>] extends [never]
      ? TypeboxScriptValue<script>
      : Extract<input, TypeboxScriptValue<script>>
    : TypeboxScriptValue<script>

type IsUnion<T, U = T> = T extends unknown ? ([U] extends [T] ? false : true) : false

type TypeboxRuntime = {
  Script: (input: string) => TSchema
  Compile: typeof TypeboxSchema.Compile
}

const fastCheckSymbol = Symbol.for('schematch.fast-check')
const require = createRequire(import.meta.url)

let typeboxRuntime: TypeboxRuntime | null = null
const schemaCache = new Map<string, StandardSchemaV1>()

export const configureTypebox = (module: TypeboxModule): void => {
  const runtime = resolveTypeboxRuntime(module)
  if (!runtime) {
    throw new TypeError('Expected a TypeBox module with a Script function.')
  }

  typeboxRuntime = runtime
  schemaCache.clear()
}

export const typeboxScriptToStandardSchema = (script: string): StandardSchemaV1 => {
  if (!typeboxRuntime) {
    throw new TypeError('TypeBox is not configured. Call match.typebox(await import("typebox")) before using string cases.')
  }

  const cached = schemaCache.get(script)
  if (cached) return cached

  const type = typeboxRuntime.Script(script)
  let validator: ReturnType<typeof TypeboxSchema.Compile> | null = null
  const getValidator = () => {
    if (!validator) validator = typeboxRuntime!.Compile(type)
    return validator
  }

  const schema = {
    '~standard': {
      version: 1,
      vendor: 'schematch:typebox',
      validate: (value: unknown) => {
        const validator = getValidator()
        if (validator.Check(value)) return {value}
        return {issues: validationIssues(validator, value)}
      },
    },
    [fastCheckSymbol]: (value: unknown) => getValidator().Check(value),
    typebox: {script, type},
  } satisfies StandardSchemaV1 & Record<PropertyKey, unknown>

  schemaCache.set(script, schema)
  return schema
}

const resolveTypeboxRuntime = (module: TypeboxModule): TypeboxRuntime | null => {
  const candidate = typeof module.Script === 'function' ? module : module.default
  const script = candidate && typeof candidate.Script === 'function' ? candidate.Script : null
  if (!script) return null

  return {
    Script: script as (input: string) => TSchema,
    Compile: resolveTypeboxCompile(module) || loadTypeboxSchemaCompile(),
  }
}

const resolveTypeboxCompile = (
  module: TypeboxModule | NonNullable<TypeboxModule['default']>
): typeof TypeboxSchema.Compile | null => {
  if (typeof module.Compile === 'function') return module.Compile
  if (typeof module.Schema?.Compile === 'function') return module.Schema.Compile
  if (typeof module.Schema?.default?.Compile === 'function') return module.Schema.default.Compile
  return null
}

const loadTypeboxSchemaCompile = (): typeof TypeboxSchema.Compile => {
  const schema = require('typebox/schema') as TypeboxSchemaModule
  const compile = resolveTypeboxCompile({Schema: schema})
  if (!compile) {
    throw new TypeError('Expected typebox/schema to expose a Compile function.')
  }
  return compile
}

const validationIssues = (
  validator: ReturnType<typeof TypeboxSchema.Compile>,
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
