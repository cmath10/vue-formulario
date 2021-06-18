import {
    ValidationContext as Context,
    ValidationRuleFn as Rule,
} from '@/validation/validator'
import { regexForFormat } from '@/utils'

const toTimestamp = (raw: unknown, fallback = NaN): number => {
    if (typeof raw === 'string') {
        return Date.parse(raw)
    }

    return raw instanceof Date ? raw.getTime() : fallback
}

/**
 * Checks if a value is after a given date. Defaults to current time
 */
export const isAfter: Rule = ({ value }: Context, compare = false): boolean => {
    return toTimestamp(value) > toTimestamp(compare, Date.now())
}

/**
 * Rule: checks if a value is after a given date. Defaults to current time
 */
export const isBefore: Rule = ({ value }: Context, compare = false): boolean => {
    return toTimestamp(value) < toTimestamp(compare, Date.now())
}

/**
 * Rule: ensures the value is a date according to Date.parse(), or a format regex.
 */
export const isDate: Rule = ({ value }: Context, format = false): boolean => {
    return format ? regexForFormat(format as string).test(value as string) : !isNaN(Date.parse(value as string))
}
