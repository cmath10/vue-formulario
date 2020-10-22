import { VueConstructor } from 'vue'

import mimes from '@/libs/mimes'
import { has } from '@/libs/utils'
import fauxUploader from '@/libs/faux-uploader'
import rules from '@/validation/rules'
import messages from '@/validation/messages'
import merge from '@/utils/merge'

import FileUpload from '@/FileUpload'

import FormularioForm from '@/FormularioForm.vue'
import FormularioFormInterface from '@/FormularioFormInterface'
import FormularioInput from '@/FormularioInput.vue'
import FormularioGrouping from '@/FormularioGrouping.vue'

import { ValidationContext, ValidationRule } from '@/validation/types'

interface FormularioOptions {
    components?: { [name: string]: VueConstructor };
    plugins?: any[];
    rules?: any;
    mimes?: any;
    uploader?: any;
    uploadUrl?: any;
    fileUrlKey?: any;
    uploadJustCompleteDuration?: any;
    validationMessages?: any;
    idPrefix?: string;
}

// noinspection JSUnusedGlobalSymbols
/**
 * The base formulario library.
 */
export default class Formulario {
    public options: FormularioOptions
    public registry: Map<string, FormularioFormInterface>
    public idRegistry: { [name: string]: number }

    constructor () {
        this.options = {
            components: {
                FormularioForm,
                FormularioInput,
                FormularioGrouping,
            },
            rules,
            mimes,
            uploader: fauxUploader,
            uploadUrl: false,
            fileUrlKey: 'url',
            uploadJustCompleteDuration: 1000,
            validationMessages: messages,
            idPrefix: 'formulario-'
        }
        this.registry = new Map()
        this.idRegistry = {}
    }

    /**
     * Install vue formulario, and register it’s components.
     */
    install (Vue: VueConstructor, options?: FormularioOptions): void {
        Vue.prototype.$formulario = this
        this.extend(options || {})
        for (const componentName in this.options.components) {
            if (has(this.options.components, componentName)) {
                Vue.component(componentName, this.options.components[componentName])
            }
        }
    }

    /**
     * Produce a deterministically generated id based on the sequence by which it
     * was requested. This should be *theoretically* the same SSR as client side.
     * However, SSR and deterministic ids can be very challenging, so this
     * implementation is open to community review.
     */
    nextId (vm: Vue): string {
        const options = this.options as FormularioOptions
        const path = vm.$route && vm.$route.path ? vm.$route.path : false
        const pathPrefix = path ? vm.$route.path.replace(/[/\\.\s]/g, '-') : 'global'
        if (!has(this.idRegistry, pathPrefix)) {
            this.idRegistry[pathPrefix] = 0
        }
        return `${options.idPrefix}${pathPrefix}-${++this.idRegistry[pathPrefix]}`
    }

    /**
     * Given a set of options, apply them to the pre-existing options.
     */
    extend (extendWith: FormularioOptions): Formulario {
        if (typeof extendWith === 'object') {
            this.options = merge(this.options, extendWith)
            return this
        }
        throw new Error(`VueFormulario extend() should be passed an object (was ${typeof extendWith})`)
    }

    /**
     * Get validation rules by merging any passed in with global rules.
     */
    rules (rules: Record<string, ValidationRule> = {}): () => Record<string, ValidationRule> {
        return { ...this.options.rules, ...rules }
    }

    /**
     * Get the validation message for a particular error.
     */
    validationMessage (rule: string, context: ValidationContext, vm: Vue): string {
        if (has(this.options.validationMessages, rule)) {
            return this.options.validationMessages[rule](vm, context)
        } else {
            return this.options.validationMessages.default(vm, context)
        }
    }

    /**
     * Given an instance of a FormularioForm register it.
     */
    register (form: FormularioFormInterface): void {
        if (typeof form.name === 'string') {
            this.registry.set(form.name, form)
        }
    }

    /**
     * Given an instance of a form, remove it from the registry.
     */
    deregister (form: FormularioFormInterface): void {
        if (typeof form.name === 'string' && this.registry.has(form.name)) {
            this.registry.delete(form.name)
        }
    }

    /**
     * Given an array, this function will attempt to make sense of the given error
     * and hydrate a form with the resulting errors.
     */
    handle ({ formErrors, inputErrors }: {
        formErrors?: string[];
        inputErrors?: Record<string, any>;
    }, formName: string): void {
        if (this.registry.has(formName)) {
            const form = this.registry.get(formName) as FormularioFormInterface

            form.loadErrors({
                formErrors: formErrors || [],
                inputErrors: inputErrors || {}
            })
        }
    }

    /**
     * Reset a form.
     */
    reset (formName: string, initialValue: Record<string, any> = {}): void {
        this.resetValidation(formName)
        this.setValues(formName, initialValue)
    }

    /**
     * Reset the form's validation messages.
     */
    resetValidation (formName: string): void {
        if (this.registry.has(formName)) {
            (this.registry.get(formName) as FormularioFormInterface).resetValidation()
        }
    }

    /**
     * Set the form values.
     */
    setValues (formName: string, values?: Record<string, any>): void {
        if (this.registry.has(formName) && values) {
            (this.registry.get(formName) as FormularioFormInterface).setValues({ ...values })
        }
    }

    /**
     * Get the file uploader.
     */
    getUploader (): any {
        return this.options.uploader || false
    }

    /**
     * Get the global upload url.
     */
    getUploadUrl (): string | boolean {
        return this.options.uploadUrl || false
    }

    /**
     * When re-hydrating a file uploader with an array, get the sub-object key to
     * access the url of the file. Usually this is just "url".
     */
    getFileUrlKey (): string {
        return this.options.fileUrlKey || 'url'
    }

    /**
     * Create a new instance of an upload.
     */
    createUpload (data: DataTransfer, context: Record<string, any>): FileUpload {
        return new FileUpload(data, context, this.options)
    }
}
