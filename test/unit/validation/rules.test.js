import rules from '@/validation/rules.ts'

const today = new Date()
const tomorrow = new Date()
const yesterday = new Date()

tomorrow.setDate(today.getDate() + 1)
yesterday.setDate(today.getDate() - 1)

describe('accepted', () => {
    const validate = value => rules.accepted({ value, path: '', state: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    test('passes with true', () => expectPass('yes'))
    test('passes with on', () => expectPass('on'))
    test('passes with 1', () => expectPass('1'))
    test('passes with number 1', () => expectPass(1))
    test('passes with boolean true', () => expectPass(true))
    test('fail with boolean false', () => expectFail(false))
    test('fail with "false"', () => expectFail('false'))
})

describe('after', () => {
    const validate = (value, compare = false) => rules.after({ value, path: '', state: {} }, compare)
    const expectPass = (value, compare = false) => expect(validate(value, compare)).toBe(true)
    const expectFail = (value, compare = false) => expect(validate(value, compare)).toBe(false)

    test('passes with tomorrow’s date object', () => expectPass(tomorrow))
    test('passes with future date', () => expectPass('January 15, 2999'))
    test('passes with long past date', () => expectPass(yesterday, 'Jan 15, 2000'))
    test('fails with yesterday’s date', () => expectFail(yesterday))
    test('fails with old date string', () => expectFail('January, 2000'))
    test('fails with invalid value', () => expectFail(''))
})

describe('alpha', () => {
    const validate = (value, set = 'default') => rules.alpha({ value, path: '', state: {} }, set)

    test('passes with simple string', () => {
        expect(validate('abc')).toBe(true)
    })

    test('passes with long string', () => {
        expect(validate('lkashdflaosuihdfaisudgflakjsdbflasidufg')).toBe(true)
    })

    test('passes with single character', () => {
        expect(validate('z')).toBe(true)
    })

    test('passes with accented character', () => {
        expect(validate('jüstin')).toBe(true)
    })

    test('passes with lots of accented characters', () => {
        expect(validate('àáâäïíôöÆ')).toBe(true)
    })

    test('passes with lots of accented characters if invalid set', () => {
        expect(validate('àáâäïíôöÆ', 'russian')).toBe(true)
    })

    test('fails with lots of accented characters if latin', () => {
        expect(validate('àáâäïíôöÆ', 'latin')).toBe(false)
    })

    test('fails with numbers', () => {
        expect(validate('justin83')).toBe(false)
    })

    test('fails with symbols', () => {
        expect(validate('-justin')).toBe(false)
    })
})

describe('alphanumeric', () => {
    const validate = (value, set = 'default') => rules.alphanumeric({ value, path: '', state: {} }, set)

    test('passes with simple string', () => {
        expect(validate('567abc')).toBe(true)
    })

    test('passes with long string', () => {
        expect(validate('lkashdfla234osuihdfaisudgflakjsdbfla567sidufg')).toBe(true)
    })

    test('passes with single character', () => {
        expect(validate('z')).toBe(true)
    })

    test('passes with accented character', () => {
        expect(validate('jüst56in')).toBe(true)
    })

    test('passes with lots of accented characters', () => {
        expect(validate('àáâ7567567äïíôöÆ')).toBe(true)
    })

    test('passes with lots of accented characters if invalid set', () => {
        expect(validate('123123àáâäï67íôöÆ', 'russian')).toBe(true)
    })

    test('fails with lots of accented characters if latin', () => {
        expect(validate('àáâäï123123íôöÆ', 'latin')).toBe(false)
    })

    test('fails with decimals in', () => {
        expect(validate('abcABC99.123')).toBe(false)
    })
})

describe('before', () => {
    const validate = (value, compare = false) => rules.before({ value, path: '', state: {} }, compare)
    const expectPass = (value, compare = false) => expect(validate(value, compare)).toBe(true)
    const expectFail = (value, compare = false) => expect(validate(value, compare)).toBe(false)

    test('fails with tomorrow’s date object', () => expectFail(tomorrow))
    test('fails with future date', () => expectFail('January 15, 2999'))
    test('fails with long past date', () => expectFail(yesterday, 'Jan 15, 2000'))
    test('passes with yesterday’s date', () => expectPass(yesterday))
    test('passes with old date string', () => expectPass('January, 2000'))
    test('fails with invalid value', () => expectFail(''))
})

describe('between', () => {
    const validate = (value, from, to, force = undefined) => {
        return rules.between({value, path: '', state: {}}, from, to, force)
    }

    const expectPass = (value, from, to, force = undefined) => expect(validate(value, from, to, force)).toBe(true)
    const expectFail = (value, from, to, force = undefined) => expect(validate(value, from, to, force)).toBe(false)

    test('passes with simple number', () => expectPass(5, 0, 10))
    test('passes with simple number string', () => expectPass('5', '0', '10'))
    test('passes with decimal number string', () => expectPass('0.5', '0', '1'))
    test('passes with string length', () => expectPass('abc', 2, 4))
    test('fails with string length too long', () => expectFail('abcdef', 2, 4))
    test('fails with string length too short', () => expectFail('abc', 3, 10))
    test('fails with number too small', () => expectFail(0, 3, 10))
    test('fails with number too large', () => expectFail(15, 3, 10))
    test('passes when forced to value', () => expectPass('4', 3, 10, 'value'))
    test('fails when forced to value', () => expectFail(442, 3, 10, 'value'))
    test('passes when forced to length', () => expectPass(7442, 3, 10, 'length'))
    test('fails when forced to length', () => expectFail(6, 3, 10, 'length'))
})

describe('confirm', () => {
    const validate = (context, field = undefined) => rules.confirm(context, field)
    const expectPass = (context, field = undefined) => expect(validate(context, field)).toBe(true)
    const expectFail = (context, field = undefined) => expect(validate(context, field)).toBe(false)

    test('Passes when the values are the same strings', () => expectPass({
        path: 'password',
        value: 'abc',
        state: { password_confirm: 'abc' }
    }))

    test('Passes when the values are the same integers', () => expectPass({
        path: 'xyz',
        value: 4422132,
        state: { xyz_confirm: 4422132 }
    }))

    test('Passes when using a custom field', () => expectPass({
        path: 'name',
        value: 4422132,
        state: { other_field: 4422132 }
    }, 'other_field'))

    test('Passes when using a custom nested field', () => expectPass({
        path: 'name',
        value: 4422132,
        state: { other: { field: 4422132 } },
    }, 'other.field'))

    test('Passes when using a field ends in _confirm', () => expectPass({
        path: 'password_confirm',
        value: '$ecret',
        state: { password: '$ecret' }
    }))

    test('Fails when using different strings', () => expectFail({
        path: 'name',
        value: 'Justin',
        state: { name_confirm: 'Daniel' }
    }))

    test('Fails when the types are different', () => expectFail({
        path: 'num',
        value: '1234',
        state: { num_confirm: 1234 }
    }))
})

describe('date', () => {
    const validate = (value, format = false) => rules.date({ value, path: '', state: {} }, format)
    const expectPass = (value, compare = false) => expect(validate(value, compare)).toBe(true)
    const expectFail = (value, compare = false) => expect(validate(value, compare)).toBe(false)

    test('passes with month day year', () => expectPass('December 17, 2020'))
    test('passes with month day', () => expectPass('December 17'))
    test('passes with short month day', () => expectPass('Dec 17'))
    test('passes with short month day and time', () => expectPass('Dec 17 12:34:15'))
    test('passes with out of bounds number', () => expectPass('January 77'))
    test('fails with only month', () => expectFail('January'))
    test('passes with valid date format', () => expectPass('12/17/1987', 'MM/DD/YYYY'))
    test('fails with simple number and date format', () => expectFail('1234', 'MM/DD/YYYY'))
    test('fails with only day of week', () => expectFail('saturday'))
    test('fails with random string', () => expectFail('Pepsi 17'))
    test('fails with random number', () => expectFail('1872301237'))
})

/**
 * Note: testing is light, regular expression used is here: http://jsfiddle.net/ghvj4gy9/embedded/result,js/
 */
describe('email', () => {
    const validate = value => rules.email({ value, path: '', state: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    test('passes normal email', () => expectPass('dev+123@wearebraid.com'))
    test('passes numeric email', () => expectPass('12345@google.com'))
    test('passes unicode email', () => expectPass('àlphä@❤️.ly'))
    test('passes numeric with new tld', () => expectPass('12345@google.photography'))
    test('fails string without tld', () => expectFail('12345@localhost'))
    test('fails string without invalid name', () => expectFail('1*(123)2345@localhost'))
})

describe('endsWith', () => {
    const validate = (value, ...haystack) => rules.endsWith({ value, path: '', state: {} }, ...haystack)
    const expectPass = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(true)
    const expectFail = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(false)

    test('fails when value ending is not in stack of single value', () => expectFail(
        'andrew@wearebraid.com',
        '@gmail.com'
    ))

    test('fails when value ending is not in stack of multiple values', () => expectFail(
        'andrew@wearebraid.com',
        '@gmail.com', '@yahoo.com'
    ))

    test('fails when passed value is not a string', () => expectFail(
        'andrew@wearebraid.com',
        ['@gmail.com', '@wearebraid.com']
    ))

    test('fails when passed value is not a string', () => expectFail(
        'andrew@wearebraid.com',
        { value: '@wearebraid.com' }
    ))

    test('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
        expectPass('andrew@wearebraid.com', { value: 'bad data' }, ['no bueno'], '@wearebraid.com')
    })

    test('passes when stack consists of zero values', () => expectPass('andrew@wearebraid.com'))

    test('passes when value ending is in stack of single value', () => expectPass(
        'andrew@wearebraid.com',
        '@wearebraid.com'
    ))

    test('passes when value ending is in stack of multiple values', () => expectPass(
        'andrew@wearebraid.com',
        '@yahoo.com', '@wearebraid.com', '@gmail.com'
    ))
})

describe('in', () => {
    const validate = (value, ...haystack) => rules.in({ value, path: '', state: {} }, ...haystack)
    const expectPass = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(true)
    const expectFail = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(false)

    test('fails when not in stack', () => expectFail('third', 'first', 'second'))
    test('fails when case sensitive mismatch is in stack', () => expectFail(
        'third',
        'first', 'second', 'Third'
    ))
    test('fails comparing dissimilar objects', () => expectFail(
        { f: 'abc' },
        { a: 'cdf' }, { b: 'abc' }
    ))
    test('passes when case sensitive match is in stack', () => expectPass(
        'third',
        'first', 'second', 'third'
    ))
    test('passes a shallow array compare', () => expectPass(['abc'], ['cdf'], ['abc']))
    test('passes a shallow object compare', () => expectPass(
        { f: 'abc' },
        { a: 'cdf' }, { f: 'abc' }
    ))
})

describe('matches', () => {
    const validate = (value, ...haystack) => rules.matches({ value, path: '', state: {} }, ...haystack)
    const expectPass = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(true)
    const expectFail = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(false)

    test('simple strings fail if they aren’t equal', () => expectFail('third', 'first'))
    test('fails on non matching regex', () => expectFail('third', /^thirds/))
    test('passes if simple strings match', () => expectPass('second', 'third', 'second'))
    test('passes on matching regex', () => expectPass('third', /^third/))
    test('passes on matching mixed regex and string', () => expectPass(
        'first-fourth',
        'second', /^third/, /fourth$/
    ))
    test('fails on a regular expression encoded as a string', () => expectFail('mypassword', '/[0-9]/'))
    test('passes on a regular expression encoded as a string', () => expectPass('mypa55word', '/[0-9]/'))
    test('passes on a regular expression containing slashes', () => expectPass(
        'https://',
        '/https?:///'
    ))
})

describe('max', () => {
    const validate = (value, max, force = undefined) => rules.max({value, path: '', state: {}}, max, force)
    const expectPass = (v, max, force = undefined) => expect(validate(v, max, force)).toBe(true)
    const expectFail = (v, max, force = undefined) => expect(validate(v, max, force)).toBe(false)

    test('passes when a number string', () => expectPass('5', '5'))
    test('passes when a number', () => expectPass(5, 6))
    test('passes when a string length', () => expectPass('foobar', '6'))
    test('passes when a array length', () => expectPass(Array(6), '6'))
    test('passes when forced to validate on length', () => expectPass(10, 3, 'length'))
    test('passes when forced to validate string on value', () => expectPass('b', 'e', 'value'))
    test('fails when a array length', () => expectFail(Array(6), '5'))
    test('fails when a string length', () => expectFail('bar', 2))
    test('fails when a number', () => expectFail(10, '7'))
    test('fails when forced to validate on length', () => expectFail(-10, '1', 'length'))
})

describe('min', () => {
    const validate = (value, min, force = undefined) => rules.min({value, path: '', state: {}}, min, force)
    const expectPass = (v, min, force = undefined) => expect(validate(v, min, force)).toBe(true)
    const expectFail = (v, min, force = undefined) => expect(validate(v, min, force)).toBe(false)

    test('passes when a number string', () => expectPass('5', '5'))
    test('passes when a number', () => expectPass(6, 5))
    test('passes when a string length', () => expectPass('foobar', '6'))
    test('passes when a array length', () => expectPass(Array(6), '6'))
    test('passes when string is forced to value', () => expectPass('bcd', 'aaa', 'value'))
    test('fails when string is forced to lesser value', () => expectFail('a', 'b', 'value'))
    test('passes when a number is forced to length', () => expectPass('000', 3, 'length'))
    test('fails when a number is forced to length', () => expectFail('44', 3, 'length'))
    test('fails when a array length', () => expectFail(Array(6), '7'))
    test('fails when a string length', () => expectFail('bar', 4))
    test('fails when a number', () => expectFail(3, '7'))
})

describe('not', () => {
    const validate = (value, ...haystack) => rules.not({ value, path: '', state: {} }, ...haystack)
    const expectPass = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(true)
    const expectFail = (value, ...haystack) => expect(validate(value, ...haystack)).toBe(false)

    test('passes when a number string', () => expectPass('5', '6'))
    test('passes when a number', () => expectPass(1, 30))
    test('passes when a string', () => expectPass('abc', 'def'))
    test('fails when a shallow equal array', () => expectFail(['abc'], ['abc']))
    test('fails when a shallow equal object', () => expectFail({a: 'abc'}, ['123'], {a: 'abc'}))
    test('fails when string is in stack', () => expectFail('a', 'b', 'c', 'd', 'a', 'f'))
})

describe('number', () => {
    const validate = value => rules.number({ value, path: '', state: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    test('passes with simple number string', () => expectPass('123'))
    test('passes with simple number', () => expectPass(19832461234))
    test('passes with float', () => expectPass(198.32464))
    test('passes with decimal in string', () => expectPass('567.23'))
    test('fails with comma in number string', () => expectFail('123,456'))
    test('fails with alpha', () => expectFail('123sdf'))
})

describe('required', () => {
    const validate = (value, isRequired = true) => rules.required({ value, path: '', state: {} }, isRequired)
    const expectPass = (value, isRequired = true) => expect(validate(value, isRequired)).toBe(true)
    const expectFail = (value, isRequired = true) => expect(validate(value, isRequired)).toBe(false)

    test('fails on empty string', () => expectFail(''))
    test('fails on empty array', () => expectFail([]))
    test('fails on empty object', () => expectFail({}))
    test('fails on null', () => expectFail(null))
    test('passes with the number zero', () => expectPass(0))
    test('passes with the boolean false', () => expectPass(false))
    test('passes with a non empty array', () => expectPass(['123']))
    test('passes with a non empty object', () => expectPass({ a: 'b' }))
    test('passes with empty value if second argument is false', () => expectPass('', false))
    test('passes with empty value if second argument is false string', () => {
        expectPass('', 'false')
    })
})

describe('startsWith', () => {
    const validate = (value, ...args) => rules.startsWith({ value, path: '', state: {} }, ...args)

    test('fails when value starting is not in stack of single value', () => {
        expect(validate('taco tuesday', 'pizza')).toBe(false)
    })

    test('fails when value starting is not in stack of multiple values', () => {
        expect(validate('taco tuesday', 'pizza', 'coffee')).toBe(false)
    })

    test('fails when passed value is not a string', () => {
        expect(validate('taco tuesday', ['taco', 'pizza'])).toBe(false)
    })

    test('fails when passed value is not a string', () => {
        expect(validate('taco tuesday', {value: 'taco'})).toBe(false)
    })

    test('passes when a string value is present and matched even if non-string values also exist as arguments', () => {
        expect(validate('taco tuesday', {value: 'taco'}, ['taco'], 'taco')).toBe(true)
    })

    test('passes when stack consists of zero values', () => {
        expect(validate('taco tuesday')).toBe(true)
    })

    test('passes when value starting is in stack of single value', () => {
        expect(validate('taco tuesday', 'taco')).toBe(true)
    })

    test('passes when value starting is in stack of multiple values', () => {
        expect(validate('taco tuesday', 'pizza', 'taco', 'coffee')).toBe(true)
    })
})

/**
 * Url rule.
 *
 * Note: these are just sanity checks because the actual package we use is
 * well tested: https://github.com/segmentio/is-url/blob/master/test/index.js
 */
describe('url', () => {
    const validate = value => rules.url({ value, path: '', state: {} })
    const expectPass = value => expect(validate(value)).toBe(true)
    const expectFail = value => expect(validate(value)).toBe(false)

    test('passes with http://google.com', () => expectPass('http://google.com'))
    test('passes with http://scholar.google.com', () => expectPass('http://scholar.google.com'))
    test('fails with google.com', () => expectFail('google.com'))
})
