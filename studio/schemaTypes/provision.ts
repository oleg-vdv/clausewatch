import {defineType, defineField} from 'sanity'

/**
 * One citable unit of a source: an article, a control, a clause.
 * Provisions are what the agent quotes. Requirements are what it reasons over.
 */
export const provision = defineType({
  name: 'provision',
  title: 'Provision',
  type: 'document',
  fields: [
    defineField({name: 'source', type: 'reference', to: [{type: 'source'}], validation: (r) => r.required()}),
    defineField({
      name: 'citation',
      type: 'string',
      description: 'Exactly as a lawyer would write it: "Art. 12(1)", "A.8.3", "ст. 14 п. 2"',
      validation: (r) => r.required(),
    }),
    defineField({name: 'heading', type: 'string'}),
    defineField({
      name: 'text',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Operative text, verbatim. Do not paraphrase here — the KB and this must agree.',
    }),
    defineField({
      name: 'effectiveFrom',
      type: 'date',
      description: 'Staggered application dates are a common source of false conflicts',
    }),
    defineField({
      name: 'appliesToRoles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'role'}]}],
    }),
    defineField({name: 'sourceUrl', type: 'url', description: 'Deep link to the exact clause'}),
  ],
  preview: {
    select: {title: 'citation', subtitle: 'heading', source: 'source.shortName'},
    prepare: ({title, subtitle, source}) => ({title: [source, title].filter(Boolean).join(' '), subtitle}),
  },
})
