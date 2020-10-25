import { cloneDeep, isScalar, regexForFormat, snakeToCamel } from '@/libs/utils'

describe('regexForFormat', () => {
  it('allows MM format with other characters', () => expect(regexForFormat('abc/MM').test('abc/01')).toBe(true))

  it('fails MM format with single digit', () => expect(regexForFormat('abc/MM').test('abc/1')).toBe(false))

  it('allows M format with single digit', () => expect(regexForFormat('M/abc').test('1/abc')).toBe(true))

  it('fails MM format when out of range', () => expect(regexForFormat('M/abc').test('13/abc')).toBe(false))

  it('fails M format when out of range', () => expect(regexForFormat('M/abc').test('55/abc')).toBe(false))

  it('Replaces double digits before singles', () => expect(regexForFormat('MMM').test('313131')).toBe(false))

  it('allows DD format with zero digit', () => expect(regexForFormat('xyz/DD').test('xyz/01')).toBe(true))

  it('fails DD format with single digit', () => expect(regexForFormat('xyz/DD').test('xyz/9')).toBe(false))

  it('allows D format with single digit', () => expect(regexForFormat('xyz/D').test('xyz/9')).toBe(true))

  it('fails D format with out of range digit', () => expect(regexForFormat('xyz/D').test('xyz/92')).toBe(false))

  it('fails DD format with out of range digit', () => expect(regexForFormat('xyz/D').test('xyz/32')).toBe(false))

  it('allows YY format with double zeros', () => expect(regexForFormat('YY').test('00')).toBe(true))

  it('fails YY format with four zeros', () => expect(regexForFormat('YY').test('0000')).toBe(false))

  it('allows YYYY format with four zeros', () => expect(regexForFormat('YYYY').test('0000')).toBe(true))

  it('allows MD-YY', () => expect(regexForFormat('MD-YY').test('12-00')).toBe(true))

  it('allows DM-YY', () => expect(regexForFormat('DM-YY').test('12-00')).toBe(true))

  it('allows date like MM/DD/YYYY', () => expect(regexForFormat('MM/DD/YYYY').test('12/18/1987')).toBe(true))

  it('allows date like YYYY-MM-DD', () => expect(regexForFormat('YYYY-MM-DD').test('1987-01-31')).toBe(true))

  it('fails date like YYYY-MM-DD with out of bounds day', () => expect(regexForFormat('YYYY-MM-DD').test('1987-01-32')).toBe(false))
})

describe('isScalar', () => {
  it('passes on strings', () => expect(isScalar('hello')).toBe(true))

  it('passes on numbers', () => expect(isScalar(123)).toBe(true))

  it('passes on booleans', () => expect(isScalar(false)).toBe(true))

  it('passes on symbols', () => expect(isScalar(Symbol(123))).toBe(true))

  it('passes on null', () => expect(isScalar(null)).toBe(true))

  it('passes on undefined', () => expect(isScalar(undefined)).toBe(true))

  it('fails on pojo', () => expect(isScalar({})).toBe(false))
})

describe('cloneDeep', () => {
  it('basic objects stay the same', () => expect(cloneDeep({ a: 123, b: 'hello' })).toEqual({ a: 123, b: 'hello' }))

  it('basic nested objects stay the same', () => {
    expect(cloneDeep({ a: 123, b: { c: 'hello-world' } }))
    .toEqual({ a: 123, b: { c: 'hello-world' } })
  })

  it('simple pojo reference types are re-created', () => {
    const c = { c: 'hello-world' }
    const clone = cloneDeep({ a: 123, b: c })
    expect(clone.b === c).toBe(false)
  })

  it('retains array structures inside of a pojo', () => {
    const obj = { a: 'abcd', d: ['first', 'second'] }
    const clone = cloneDeep(obj)
    expect(Array.isArray(clone.d)).toBe(true)
  })

  it('removes references inside array structures', () => {
    const deepObj = {foo: 'bar'}
    const obj = { a: 'abcd', d: ['first', deepObj] }
    const clone = cloneDeep(obj)
    expect(clone.d[1] === deepObj).toBe(false)
  })
})

describe('snakeToCamel', () => {
  it('converts underscore separated words to camelCase', () => {
    expect(snakeToCamel('this_is_snake_case')).toBe('thisIsSnakeCase')
  })

  it('converts underscore separated words to camelCase even if they start with a number', () => {
    expect(snakeToCamel('this_is_snake_case_2nd_example')).toBe('thisIsSnakeCase2ndExample')
  })

  it('has no effect on already camelCase words', () => {
    expect(snakeToCamel('thisIsCamelCase')).toBe('thisIsCamelCase')
  })

  it('does not capitalize the first word or strip first underscore if a phrase starts with an underscore', () => {
    expect(snakeToCamel('_this_starts_with_an_underscore')).toBe('_thisStartsWithAnUnderscore')
  })

  it('ignores double underscores anywhere in a word', () => {
    expect(snakeToCamel('__unlikely__thing__')).toBe('__unlikely__thing__')
  })

  it('has no effect hyphenated words', () => {
    expect(snakeToCamel('not-a-good-name')).toBe('not-a-good-name')
  })

  it('returns the same function if passed', () => {
    const fn = () => {}
    expect(snakeToCamel(fn)).toBe(fn)
  })
})
