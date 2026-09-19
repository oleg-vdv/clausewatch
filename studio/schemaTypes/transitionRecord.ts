import {defineType, defineField} from 'sanity'

/**
 * One move that actually happened. The audit trail an auditor asks for is not
 * "what state is this in" but "how did it get there, and who moved it".
 */
export const transitionRecord = defineType({
  name: 'transitionRecord',
  title: 'Transition record',
  type: 'object',
  fields: [
    defineField({name: 'at', type: 'datetime', validation: (r) => r.required()}),
    defineField({name: 'from', type: 'string'}),
    defineField({name: 'to', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'actorKind',
      type: 'string',
      options: {
        list: [
          {title: 'Agent', value: 'agent'},
          {title: 'Person', value: 'human'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'actor',
      type: 'string',
      description: 'A person by name, or the agent by its identifier',
      validation: (r) => r.required(),
    }),
    defineField({name: 'note', type: 'text', rows: 2}),
  ],
  preview: {
    select: {to: 'to', actor: 'actor', kind: 'actorKind', at: 'at'},
    prepare: ({to, actor, kind, at}) => ({
      title: `→ ${to}`,
      subtitle: `${actor} (${kind})${at ? ' · ' + String(at).slice(0, 10) : ''}`,
    }),
  },
})
