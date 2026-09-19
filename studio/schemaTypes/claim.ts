import {defineType, defineField} from 'sanity'

/**
 * One instrument's position on one requirement. An object, not a document: a claim has
 * no meaning outside its requirement, but it must carry its own provenance — every
 * value the agent states out loud has to point back at a clause.
 */
export const claim = defineType({
  name: 'claim',
  title: 'Claim',
  type: 'object',
  fields: [
    defineField({
      name: 'provision',
      type: 'reference',
      to: [{type: 'provision'}],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'assertion',
      type: 'text',
      rows: 2,
      description: 'What this clause requires, in one sentence',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'strength',
      type: 'string',
      options: {
        list: [
          {title: 'Must (mandatory)', value: 'must'},
          {title: 'Should (expected, justify deviation)', value: 'should'},
          {title: 'May (permitted)', value: 'may'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'direction',
      type: 'string',
      description:
        'Which way the clause pushes on duration. Without this, a clause that caps retention and a clause that never mentions it both read as silence.',
      options: {
        list: [
          {title: 'Floor — sets a minimum', value: 'floor'},
          {title: 'Ceiling — caps it', value: 'ceiling'},
          {title: 'Neither — imposes the duty, says nothing about duration', value: 'none'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'retentionMonths',
      type: 'number',
      description:
        'Only where the clause states a number. A ceiling worded as "no longer than necessary" has a direction but no number — that is not a gap in the data.',
    }),
    defineField({
      name: 'conditionalOn',
      type: 'text',
      rows: 2,
      description: 'The "only if" that most summaries drop: risk class, sector, headcount',
    }),
    defineField({
      name: 'verbatimAnchor',
      type: 'string',
      description: 'Short quoted phrase to locate the matching entry in the Knowledge Base',
    }),
  ],
  preview: {
    select: {
      assertion: 'assertion',
      strength: 'strength',
      source: 'provision.source.shortName',
      citation: 'provision.citation',
    },
    prepare: ({assertion, strength, source, citation}) => ({
      title: [source, citation].filter(Boolean).join(' ') || 'Claim',
      subtitle: [strength?.toUpperCase(), assertion].filter(Boolean).join(' — '),
    }),
  },
})
