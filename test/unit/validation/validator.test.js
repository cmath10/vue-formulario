import {
    createValidator,
    enlarge,
    parseModifier,
    processSingleArrayConstraint,
    processSingleStringConstraint,
    validate,
} from '@/validation/validator.ts'

const isNumberAndInRangeRule = ({ value }, from, to) => !isNaN(value) && value >= from && value <= to
const isNumberAndInRangeMessage = ({ value }, from, to) => {
    return isNaN(value) ? 'Value is NaN' : `Value not in range [${from}, ${to}]`
}

describe('createValidator', () => {
    test('Creates correct validator', async () => {
        const context = { state: {}, path: 'field', value: 'abc' }
        const validate = createValidator(
            isNumberAndInRangeRule,
            'rule',
            [1, 2],
            isNumberAndInRangeMessage,
        )

        await expect(validate(context)).toBeInstanceOf(Promise)
        expect(await validate(context)).toEqual({
            rule: 'rule',
            args: [1, 2],
            context,
            message: 'Value is NaN',
        })

        expect(await validate({ ...context, value: 0 })).toEqual({
            rule: 'rule',
            args: [1, 2],
            context: { ...context, value: 0 },
            message: 'Value not in range [1, 2]',
        })

        expect(await validate({ ...context, value: 1.5 })).toBeNull()
    })
})

describe('enlarge', () => {
    test('Merges non-bail validator groups', () => {
        expect(enlarge([
            { validators: [], bail: false },
            { validators: [], bail: false },
            { validators: [], bail: false },
        ])).toEqual([
            { validators: [], bail: false },
        ])
    })

    test('Merges non-bail validator groups, bail groups stayed unmerged', () => {
        expect(enlarge([
            { validators: [], bail: false },
            { validators: [], bail: false },
            { validators: [], bail: false },
            { validators: [], bail: true },
            { validators: [], bail: true },
            { validators: [], bail: false },
            { validators: [], bail: false },
        ])).toEqual([
            { validators: [], bail: false },
            { validators: [], bail: true },
            { validators: [], bail: true },
            { validators: [], bail: false },
        ])
    })
})

describe('parseModifier', () => {
    test('Extracts modifier if present', () => {
        expect(parseModifier('^required')).toEqual(['required', '^'])
        expect(parseModifier('required')).toEqual(['required', null])
        expect(parseModifier('bail')).toEqual(['bail', null])
        expect(parseModifier('^min_length')).toEqual(['minLength', '^'])
        expect(parseModifier('min_length')).toEqual(['minLength', null])
    })
})

describe('processSingleArrayConstraint', () => {
    const rules = { isNumberAndInRange: isNumberAndInRangeRule }
    const messages = { isNumberAndInRange: isNumberAndInRangeMessage }

    test('Creates validator context if constraint is valid and rule exists', () => {
        expect(processSingleArrayConstraint(['isNumberAndInRange', 1, 2], rules, messages)).toEqual([
            expect.any(Function),
            'isNumberAndInRange',
            null,
        ])

        expect(processSingleArrayConstraint(['^is_number_and_in_range', 1, 2], rules, messages)).toEqual([
            expect.any(Function),
            'isNumberAndInRange',
            '^',
        ])
    })

    test('Creates validator context if constraint is validator', () => {
        const validate = createValidator(
            isNumberAndInRangeRule,
            null,
            [],
            isNumberAndInRangeMessage,
        )

        expect(processSingleArrayConstraint([validate], rules, messages)).toEqual([
            expect.any(Function),
            null,
            null,
        ])
    })

    test('Throws error if constraint is valid and rule not exists', () => {
        expect(() => processSingleArrayConstraint(
            ['^rule_that_not_exists'],
            { rule: isNumberAndInRangeRule },
            { rule: isNumberAndInRangeMessage },
        )).toThrow('[Formulario] Can\'t create validator for constraint: [\"^rule_that_not_exists\"]')
    })

    test('Throws error if constraint is not valid', () => {
        expect(() => processSingleArrayConstraint(
            [null],
            { rule: isNumberAndInRangeRule },
            { rule: isNumberAndInRangeMessage },
        )).toThrow('[Formulario]: For array constraint first element must be rule name or Validator function')
    })
})

describe('processSingleStringConstraint', () => {
    const rules = { isNumberAndInRange: isNumberAndInRangeRule }
    const messages = { isNumberAndInRange: isNumberAndInRangeMessage }

    test('Creates validator context if constraint is valid and rule exists', () => {
        expect(processSingleStringConstraint('isNumberAndInRange:1,2', rules, messages)).toEqual([
            expect.any(Function),
            'isNumberAndInRange',
            null,
        ])

        expect(processSingleStringConstraint('^is_number_and_in_range:1,2', rules, messages)).toEqual([
            expect.any(Function),
            'isNumberAndInRange',
            '^',
        ])
    })

    test('Throws error if constraint is valid and rule not exists', () => {
        expect(() => processSingleStringConstraint(
            '^rule_that_not_exists',
            { rule: isNumberAndInRangeRule },
            { rule: isNumberAndInRangeMessage },
        )).toThrow('[Formulario] Can\'t create validator for constraint: ^rule_that_not_exists')
    })
})

describe('validate', () => {
    const isNumber = createValidator(
        ({ value }) => String(value) !== '' && !isNaN(value),
        'number',
        [],
        () => 'Value is NaN'
    )
    const isRequired = createValidator(
        ({ value }) => value !== undefined && String(value) !== '',
        'required',
        [],
        () => 'Value is required'
    )
    const context = { path: 'field', value: '', state: {} }

    test('Applies all rules if no bail', async () => {
        expect(await validate([
            [isRequired, 'required', null],
            [isNumber, 'number', null],
        ], context)).toEqual([{
            rule: 'required',
            args: [],
            context,
            message: 'Value is required',
        }, {
            rule: 'number',
            args: [],
            context,
            message: 'Value is NaN',
        }])
    })

    test('Applies only first rule (bail)', async () => {
        expect(await validate([
            [() => {}, 'bail', null],
            [isRequired, 'required', '^'],
            [isNumber, 'number', null],
        ], context)).toEqual([{
            rule: 'required',
            args: [],
            context,
            message: 'Value is required',
        }])
    })

    test('Applies only first rule (bail modifier)', async () => {
        expect(await validate([
            [isRequired, 'required', '^'],
            [isNumber, 'number', null],
        ], context)).toEqual([{
            rule: 'required',
            args: [],
            context,
            message: 'Value is required',
        }])
    })

    test('No violations on valid context', async () => {
        expect(await validate([
            [isRequired, 'required', '^'],
            [isNumber, 'number', null],
        ], { ...context, value: 0 })).toEqual([])
    })
})
