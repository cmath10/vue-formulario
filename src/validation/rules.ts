import isUrl from 'is-url'
import { deepEquals, get, has } from '@/utils'
import {
    ValidationContext,
    ValidationRuleFn,
} from '@/validation/validator'
import {
    isAfter,
    isBefore,
    isDate,
} from '@/validation/rules/dates'

interface HasLength {
    length: number;
}

const rules: Record<string, ValidationRuleFn> = {
    /**
     * Rule: the value must be "yes", "on", "1", or true
     */
    accepted ({ value }: ValidationContext): boolean {
        return (['yes', 'on', '1', 1, true, 'true'] as unknown[]).includes(value)
    },

    after: isAfter,

    /**
     * Rule: checks if the value is only alpha
     */
    alpha ({ value }: ValidationContext, set = 'default'): boolean {
        const key = `${set}`
        const sets: Record<string, RegExp> = {
            default: /^[a-zA-ZÀ-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z]+$/,
        }

        return typeof value === 'string' && sets[has(sets, key) ? key : 'default'].test(value)
    },

    /**
     * Rule: checks if the value is alpha numeric
     */
    alphanumeric ({ value }: ValidationContext, set = 'default'): boolean {
        const key = `${set}`
        const sets: Record<string, RegExp> = {
            default: /^[a-zA-Z0-9À-ÖØ-öø-ÿ]+$/,
            latin: /^[a-zA-Z0-9]+$/
        }

        return typeof value === 'string' && sets[has(sets, key) ? key : 'default'].test(value)
    },

    before: isBefore,

    /**
     * Rule: checks if the value is between two other values
     */
    between ({ value }: ValidationContext, from = 0, to = 10, by?): boolean {
        if (from === null || to === null || isNaN(from as number) || isNaN(to as number)) {
            return false
        }

        const inRange = (value: number, [from, to]: [number, number]): boolean => value > from && value < to

        if ((!isNaN(value as number) && by !== 'length') || by === 'value') {
            return inRange(Number(value), [Number(from), Number(to)])
        }

        if (typeof value === 'string' || by === 'length') {
            const v = !isNaN(value as number) ? String(value) : value as HasLength
            return inRange(v.length, [Number(from), Number(to)])
        }

        return false
    },

    /**
     * Confirm that the value of one field is the same as another, mostly used
     * for password confirmations.
     */
    confirm ({ value, state, path }: ValidationContext, confirmationFieldPath?: unknown): boolean {
        const _confirmationFieldPath: string = typeof confirmationFieldPath === 'string'
            ? confirmationFieldPath
            : /_confirm$/.test(path)
                ? path.substr(0, path.length - 8)
                : `${path}_confirm`

        return get(state, _confirmationFieldPath, NaN) === value
    },

    date: isDate,

    /**
     * Rule: tests
     */
    email ({ value }: ValidationContext): boolean {
        if (!value) {
            return true
        }

        // eslint-disable-next-line
        const isEmail = /^(([^<>()\[\].,;:\s@"]+(\.[^<>()\[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i
        return typeof value === 'string' && isEmail.test(value)
    },

    /**
     * Rule: Value ends with one of the given Strings
     */
    endsWith ({ value }: ValidationContext, ...haystack: unknown[]): boolean {
        if (!value) {
            return true
        }

        return typeof value === 'string' && (
            haystack.length === 0 ||
            haystack.some(str => value.endsWith(`${str}`))
        )
    },

    /**
     * Rule: Value is in an array (stack).
     */
    in ({ value }: ValidationContext, ...haystack: unknown[]): boolean {
        return haystack.some(item => deepEquals(item, value))
    },

    /**
     * Rule: Match the value against a (stack) of patterns or strings
     */
    matches: ({ value }: ValidationContext, ...stack: unknown[]): boolean => stack.some(pattern => {
        if (
            typeof pattern === 'string' &&
            pattern.substr(0, 1) === '/' &&
            pattern.substr(-1) === '/'
        ) {
            pattern = new RegExp(pattern.substr(1, pattern.length - 2))
        }

        if (pattern instanceof RegExp) {
            return pattern.test(value as string)
        }

        return pattern === value
    }),

    /**
     * Check the maximum value of a particular.
     */
    max ({ value }: ValidationContext, maximum = 10, by): boolean {
        const lessOrEqual = (value: number|string, maximum: number|string): boolean => value <= maximum

        if (Array.isArray(value)) {
            return lessOrEqual(value.length, Number(maximum))
        }

        if ((!isNaN(value as number) && by !== 'length') || by === 'value') {
            return lessOrEqual(value as number|string, maximum as number|string)
        }

        if (typeof value === 'string' || by === 'length') {
            const v = !isNaN(value as number) ? String(value) : value as HasLength
            return lessOrEqual(v.length, Number(maximum))
        }

        return false
    },

    /**
     * Check the minimum value of a particular.
     */
    min ({ value }: ValidationContext, minimum = 1, by?): boolean {
        const greaterOrEqual = (value: number|string, maximum: number|string): boolean => value >= maximum

        if (Array.isArray(value)) {
            return greaterOrEqual(value.length, Number(minimum))
        }

        if ((!isNaN(value as number) && by !== 'length') || by === 'value') {
            return greaterOrEqual(value as number|string, minimum as number|string)
        }

        if (typeof value === 'string' || by === 'length') {
            const v = !isNaN(value as number) ? String(value) : value as HasLength
            return greaterOrEqual(v.length, Number(minimum))
        }

        return false
    },

    /**
     * Rule: Value is not in stack.
     */
    not ({ value }: ValidationContext, ...haystack: unknown[]): boolean {
        return !haystack.some(item => deepEquals(item, value))
    },

    /**
     * Rule: checks if the value is only alpha numeric
     */
    number ({ value }: ValidationContext): boolean {
        return String(value).length > 0 && !isNaN(Number(value))
    },

    /**
     * Rule: must be a value
     */
    required ({ value }: ValidationContext, isRequired = true): boolean {
        if (!isRequired || ['no', 'false'].includes(isRequired as string)) {
            return true
        }

        if (typeof value === 'string' || Array.isArray(value)) {
            return value.length > 0
        }

        if (typeof value === 'object') {
            return value !== null && Object.keys(value).length > 0
        }

        return true
    },

    /**
     * Rule: Value starts with one of the given Strings
     */
    startsWith ({ value }: ValidationContext, ...haystack: unknown[]): boolean {
        if (!value) {
            return true
        }

        if (typeof value === 'string') {
            return haystack.length === 0 || haystack.some(str => value.startsWith(`${str}`))
        }

        return false
    },

    /**
     * Rule: checks if a string is a valid url
     */
    url: ({ value }: ValidationContext): boolean => typeof value === 'string' && isUrl(value),

    /**
     * Rule: not a true rule — more like a compiler flag.
     */
    bail: (): boolean => true,
}

export default rules
