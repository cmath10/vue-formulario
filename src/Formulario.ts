import merge from '@/utils/merge'
import validationRules from '@/validation/rules'
import validationMessages from '@/validation/messages'

import {
    ValidationContext,
    ValidationRuleFn,
    ValidationMessageFn,
    ValidationMessageI18NFn,
    Violation,
} from '@/validation/validator'

import { FormularioForm } from '@/types'

export interface FormularioOptions {
    validationRules?: Record<string, ValidationRuleFn>;
    validationMessages?: Record<string, ValidationMessageI18NFn|string>;
}

/**
 * The base formulario library.
 */
export default class Formulario {
    public validationRules: Record<string, ValidationRuleFn> = {}
    public validationMessages: Record<string, ValidationMessageI18NFn|string> = {}

    private readonly registry: Map<string, FormularioForm>

    public constructor (options?: FormularioOptions) {
        this.registry = new Map()

        this.validationRules = validationRules
        this.validationMessages = validationMessages

        this.extend(options || {})
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    public extend (extendWith: FormularioOptions): Formulario {
        if (typeof extendWith === 'object') {
            this.validationRules = merge(this.validationRules, extendWith.validationRules || {})
            this.validationMessages = merge(this.validationMessages, extendWith.validationMessages || {})
            return this
        }
        throw new Error(`[Formulario]: Formulario.extend(): should be passed an object (was ${typeof extendWith})`)
    }

    public runValidation (id: string): Promise<Record<string, Violation[]>> {
        if (!this.registry.has(id)) {
            throw new Error(`[Formulario]: Formulario.runValidation(): no forms with id "${id}"`)
        }

        const form = this.registry.get(id) as FormularioForm

        return form.runValidation()
    }

    public resetValidation (id: string): void {
        if (!this.registry.has(id)) {
            return
        }

        const form = this.registry.get(id) as FormularioForm

        form.resetValidation()
    }

    /**
     * Used by forms instances to add themselves into a registry
     * @internal
     */
    public register (id: string, form: FormularioForm): void {
        if (this.registry.has(id)) {
            throw new Error(`[Formulario]: Formulario.register(): id "${id}" is already in use`)
        }

        this.registry.set(id, form)
    }

    /**
     * Used by forms instances to remove themselves from a registry
     * @internal
     */
    public unregister (id: string): void {
        if (this.registry.has(id)) {
            this.registry.delete(id)
        }
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     * @internal
     */
    public getRules (extendWith: Record<string, ValidationRuleFn> = {}): Record<string, ValidationRuleFn> {
        return merge(this.validationRules, extendWith)
    }

    /**
     * Get validation messages by merging any passed in with global messages.
     * @internal
     */
    public getMessages (vm: Vue, extendWith: Record<string, ValidationMessageI18NFn|string>): Record<string, ValidationMessageFn> {
        const raw = merge(this.validationMessages || {}, extendWith)
        const messages: Record<string, ValidationMessageFn> = {}

        for (const name in raw) {
            messages[name] = (context: ValidationContext, ...args: unknown[]): string => {
                return typeof raw[name] === 'string' ? raw[name] : raw[name](vm, context, ...args)
            }
        }

        return messages
    }
}
