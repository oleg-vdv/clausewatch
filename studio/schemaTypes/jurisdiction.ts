import {defineType, defineField} from 'sanity'

export const jurisdiction = defineType({
  name: 'jurisdiction',
  title: 'Jurisdiction',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'code',
      type: 'string',
      description: 'ISO 3166 alpha-2, or EU / INTL for supranational',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'extraterritorial',
      type: 'boolean',
      description: 'Binds operators outside the territory when output is used inside it (AI Act Art. 2)',
      initialValue: false,
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'code'}},
})
