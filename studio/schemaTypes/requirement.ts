import {defineType, defineField} from 'sanity'

/**
 * The normalised obligation — "retain automatically generated logs" — held separately
 * from what each instrument says about it. One requirement, many claims.
 *
 * This split is the reason the agent can answer at all. A keyword search returns the
 * paragraph that mentions "logs"; it cannot tell you that four instruments impose the
 * same duty with three different retention periods.
 */
export const requirement = defineType({
  name: 'requirement',
  title: 'Requirement',
  type: 'document',
  fields: [
    defineField({
      name: 'obligation',
      type: 'string',
      description: 'Imperative, source-neutral: "Retain automatically generated logs"',
      validation: (r) => r.required(),
    }),
    defineField({name: 'slug', type: 'slug', options: {source: 'obligation'}}),
    defineField({
      name: 'topic',
      type: 'string',
      options: {
        list: [
          {title: 'Scope & classification', value: 'classification'},
          {title: 'Logging & record-keeping', value: 'logging'},
          {title: 'Risk management', value: 'risk'},
          {title: 'Human oversight', value: 'oversight'},
          {title: 'Transparency & disclosure', value: 'transparency'},
          {title: 'Data governance', value: 'data'},
          {title: 'Post-market monitoring', value: 'monitoring'},
          {title: 'Incident reporting', value: 'incident'},
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'claims',
      title: 'Claims',
      type: 'array',
      of: [{type: 'claim'}],
      description: 'What each instrument asserts about this obligation. Disagreement is expected.',
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'conflicts',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'conflict'}]}],
      description: 'Raised when two claims cannot both be satisfied by the same control',
    }),
    defineField({
      name: 'evidenceHint',
      type: 'text',
      rows: 3,
      description: 'What an auditor will actually ask to see. Feeds the evidence export.',
    }),
  ],
  preview: {
    select: {title: 'obligation', subtitle: 'topic', claims: 'claims'},
    prepare: ({title, subtitle, claims}) => ({
      title,
      subtitle: [subtitle, claims?.length ? `${claims.length} claims` : null].filter(Boolean).join(' · '),
    }),
  },
})
