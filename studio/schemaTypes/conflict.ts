import {defineType, defineField} from 'sanity'

/**
 * Two claims that cannot both be satisfied by the same control, plus the decision
 * someone made about it — and who made it, and when.
 *
 * The decision is the artifact. An agent that silently picks the stricter number is
 * guessing on your behalf; one that shows both sides and cites a recorded, attributed
 * decision produces something an auditor can accept.
 */
export const conflict = defineType({
  name: 'conflict',
  title: 'Conflict',
  type: 'document',
  fields: [
    defineField({name: 'summary', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'requirement',
      type: 'reference',
      to: [{type: 'requirement'}],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'sides',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'provision'}]}],
      description: 'The clauses in tension. Both get shown to the user, always.',
      validation: (r) => r.min(2),
    }),
    defineField({
      name: 'nature',
      type: 'string',
      options: {
        list: [
          {title: 'Different quantity (period, threshold)', value: 'quantity'},
          {title: 'Different scope (who it binds)', value: 'scope'},
          {title: 'Different deadline', value: 'deadline'},
          {title: 'Terminology mismatch', value: 'terminology'},
          {title: 'Version skew (one text is outdated)', value: 'version'},
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'resolution',
      type: 'string',
      options: {
        list: [
          {title: 'Open — no decision yet', value: 'open'},
          {title: 'Apply the stricter claim', value: 'stricter'},
          {title: 'Apply per jurisdiction, separately', value: 'per-jurisdiction'},
          {title: 'Not a real conflict (scopes do not overlap)', value: 'not-a-conflict'},
          {title: 'Corrected — one side was misread; cite the verified reading', value: 'corrected'},
          {title: 'Escalated to counsel', value: 'escalated'},
        ],
        layout: 'radio',
      },
      initialValue: 'open',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'rationale',
      type: 'text',
      rows: 4,
      description: 'Required once the conflict is resolved — this is the reasoning the agent quotes',
      validation: (r) =>
        r.custom((value, context) => {
          const resolution = (context.document as {resolution?: string} | undefined)?.resolution
          if (resolution && resolution !== 'open' && !value) {
            return 'A resolved conflict needs a rationale'
          }
          return true
        }),
    }),
    defineField({
      name: 'decidedBy',
      type: 'string',
      description: 'A person. Not "the system".',
    }),
    defineField({name: 'decidedAt', type: 'datetime'}),
    defineField({
      name: 'state',
      type: 'string',
      description:
        'Where this sits in the decision workflow. The legal moves out of it, and who may make them, are data — see the workflow document.',
      initialValue: 'raised',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'history',
      title: 'How it got here',
      type: 'array',
      of: [{type: 'transitionRecord'}],
      description: 'Every move, with the actor who made it. An auditor asks for this, not for the current state.',
    }),
    defineField({
      name: 'supersededBy',
      type: 'reference',
      to: [{type: 'conflict'}],
      description: 'Decisions get revisited; the earlier one stays readable',
    }),
  ],
  preview: {
    select: {title: 'summary', subtitle: 'resolution'},
  },
})
