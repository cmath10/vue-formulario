import Vue from 'vue'
import flushPromises from 'flush-promises'
import { mount } from '@vue/test-utils'

import Formulario from '@/index.ts'
import FormularioForm from '@/FormularioForm.vue'
import FormularioField from '@/FormularioField.vue'

const globalRule = jest.fn(() => false)

Vue.use(Formulario, {
    validationRules: { globalRule },
    validationMessages: {
        required: () => 'required',
        'in': () => 'in',
        min: () => 'min',
        globalRule: () => 'globalRule',
    },
})

describe('FormularioField', () => {
    it('Allows custom field-rule level validation strings', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                value: 'other value',
                validation: 'required|in:abcdef',
                validationMessages: { in: 'the value was different than expected' },
                validationBehavior: 'live',
            },
            scopedSlots: {
                default: `<div><span v-for="violation in props.context.violations">{{ violation.message }}</span></div>`
            },
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('the value was different than expected')
    })

    it('No validation on created when validationBehavior is not live', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: {in: 'the value was different than expected'},
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.violations">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('No validation on value change when validationBehavior is "submit"', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: {in: 'the value was different than expected'},
                validationBehavior: 'submit',
                value: 'Initial'
            },
            scopedSlots: {
                default: `<div>
                    <input type="text" v-model="props.context.model">
                    <span v-for="error in props.context.violations">{{ error.message }}</span>
                </div>`
            }
        })

        await flushPromises()

        expect(wrapper.find('span').exists()).toBe(false)

        wrapper.find('input[type="text"]').element['value'] = 'Test'
        wrapper.find('input[type="text"]').trigger('change')

        await flushPromises()

        expect(wrapper.find('input[type="text"]').element['value']).toBe('Test')
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('Allows custom field-rule level validation functions', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: { in: ({ value }) => `The string ${value} is not correct.` },
                validationBehavior: 'live',
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.violations">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('The string other value is not correct.')
    })

    it('No validation on created when validationBehavior is default', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|in:abcdef',
                validationMessages: { in: 'the value was different than expected' },
                value: 'other value'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.violations">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').exists()).toBe(false)
    })

    it('Uses custom async validation rules on defined on the field', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|foobar',
                validationRules: { foobar: async ({ value }) => value === 'foo' },
                validationMessages: { foobar: 'failed the foobar check' },
                validationBehavior: 'live',
                value: 'bar'
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.violations">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('failed the foobar check')
    })

    it('Uses custom sync validation rules on defined on the field', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                value: 'bar',
                validation: 'required|foobar',
                validationRules: { foobar: ({ value }) => value === 'foo' },
                validationMessages: { foobar: 'failed the foobar check' },
                validationBehavior: 'live',
            },
            scopedSlots: {
                default: `<div><span v-for="error in props.context.violations">{{ error.message }}</span></div>`
            }
        })
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('failed the foobar check')
    })

    it('Uses global custom validation rules', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                value: 'bar',
                validation: 'required|globalRule',
                validationBehavior: 'live',
            }
        })
        await flushPromises()
        expect(globalRule.mock.calls.length).toBe(1)
    })

    it('Emits correct validation event', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'fieldName',
                value: '',
                validation: 'required',
                validationBehavior: 'live',
            }
        })
        await flushPromises()

        expect(wrapper.emitted('validation')).toBeTruthy()
        expect(wrapper.emitted('validation')[0][0]).toEqual({
            name: 'fieldName',
            violations: [{
                rule: expect.stringContaining('required'),
                args: expect.any(Array),
                context: expect.any(Object),
                message: expect.any(String),
            }],
        })
    })

    it('Can bail on validation when encountering the bail rule', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'bail|required|in:xyz',
                validationBehavior: 'live',
            },
        })
        await flushPromises();
        expect(wrapper.vm.context.violations.length).toBe(1);
    })

    it('Can show multiple validation errors if they occur before the bail rule', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|in:xyz|bail',
                validationBehavior: 'live',
            },
        })
        await flushPromises();
        expect(wrapper.vm.context.violations.length).toBe(2);
    })

    it('Can avoid bail behavior by using modifier', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                value: '123',
                validation: '^required|in:xyz|min:10,length',
                validationBehavior: 'live',
            },
        })
        await flushPromises();
        expect(wrapper.vm.context.violations.length).toBe(2);
    })

    it('Prevents later error messages when modified rule fails', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: '^required|in:xyz|min:10,length',
                validationBehavior: 'live',
            },
        })
        await flushPromises();
        expect(wrapper.vm.context.violations.length).toBe(1);
    })

    it('can bail in the middle of the rule set with a modifier', async () => {
        const wrapper = mount(FormularioField, {
            propsData: {
                name: 'test',
                validation: 'required|^in:xyz|min:10,length',
                validationBehavior: 'live',
            },
        })
        await flushPromises();
        expect(wrapper.vm.context.violations.length).toBe(2);
    })

    it('Displays errors when validation-behavior is submit and form is submitted', async () => {
        const wrapper = mount(FormularioForm, {
            propsData: { name: 'test' },
            slots: {
                default: `
                    <FormularioField
                        v-slot="{ context }"
                        name="testinput"
                        validation="required"
                        validation-behavior="submit"
                    >
                        <span v-for="error in context.violations">{{ error.message }}</span>
                    </FormularioField>
                `
            }
        })

        await flushPromises()

        expect(wrapper.find('span').exists()).toBe(false)

        wrapper.trigger('submit')

        await flushPromises()

        expect(wrapper.find('span').exists()).toBe(true)
    })

    it('Model getter for input', async () => {
        const wrapper = mount({
            data: () => ({ values: { test: 'abcd' } }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioField v-slot="{ context }" :model-get-converter="onGet" name="test" >
                        <span>{{ context.model }}</span>
                    </FormularioField>
                </FormularioForm>
            `,
            methods: {
                onGet(source) {
                    if (!(source instanceof Date)) {
                        return 'invalid date'
                    }

                    return source.getDate()
                }
            }
        })

        await flushPromises()
        expect(wrapper.find('span').text()).toBe('invalid date')

        wrapper.vm.values = { test: new Date('1995-12-17') }
        await flushPromises()
        expect(wrapper.find('span').text()).toBe('17')
    })

    it('Model setter for input', async () => {
        const wrapper = mount({
            data: () => ({ values: { test: 'abcd' } }),
            template: `
                <FormularioForm v-model="values">
                    <FormularioField v-slot="{ context }" :model-get-converter="onGet" :model-set-converter="onSet" name="test" >
                        <input type="text" v-model="context.model">
                    </FormularioField>
                </FormularioForm>
            `,
            methods: {
                onGet(source) {
                    if (!(source instanceof Date)) {
                        return source
                    }

                    return source.getDate()
                },
                onSet(source) {
                    if (source instanceof Date) {
                        return source
                    }
                    if (isNaN(source)) {
                        return undefined
                    }

                    let result = new Date('2001-05-01')
                    result.setDate(source)

                    return result
                }
            }
        })

        await flushPromises()
        expect(wrapper.vm.values.test).toBe(undefined)

        wrapper.find('input[type="text"]').element['value'] = '12'
        wrapper.find('input[type="text"]').trigger('input')
        await flushPromises()
        expect(wrapper.vm.values.test.toISOString()).toBe((new Date('2001-05-12')).toISOString())
    })
})
