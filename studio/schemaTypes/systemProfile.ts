import {defineType, defineField} from 'sanity'

/**
 * The thing being regulated, described well enough to filter obligations against.
 * The agent's answer is a function of this document — which is why the same question
 * gets different correct answers for different users.
 */
export const systemProfile = defineType({
  name: 'systemProfile',
  title: 'System profile',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}}),
    defineField({name: 'description', type: 'text', rows: 3}),
    defineField({
      name: 'roles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'role'}]}],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'operatesIn',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'jurisdiction'}]}],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'outputUsedIn',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'jurisdiction'}]}],
      description: 'Kept separate from operatesIn: this is what pulls extraterritorial rules in',
    }),
    defineField({
      name: 'riskClass',
      type: 'string',
      options: {
        list: [
          {title: 'Prohibited', value: 'prohibited'},
          {title: 'High-risk', value: 'high'},
          {title: 'Limited risk (transparency only)', value: 'limited'},
          {title: 'Minimal risk', value: 'minimal'},
          {title: 'Unclassified / to be determined', value: 'unknown'},
        ],
      },
      initialValue: 'unknown',
    }),
    defineField({
      name: 'isGpai',
      title: 'General-purpose AI model',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'agentic',
      type: 'boolean',
      description: 'Takes actions, not just predictions — the case the logging rules were not written for',
      initialValue: false,
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'riskClass'}},
})
