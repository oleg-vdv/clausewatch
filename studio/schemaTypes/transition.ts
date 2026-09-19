import {defineType, defineField} from 'sanity'

/**
 * One permitted move between states, and who is permitted to make it.
 *
 * `actor` is the field the whole design rests on. An agent reading this workflow can
 * see which moves are open to it and which are not, so the boundary is data the agent
 * queries rather than an instruction it is trusted to obey.
 */
export const transition = defineType({
  name: 'transition',
  title: 'Transition',
  type: 'object',
  fields: [
    defineField({name: 'label', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'from', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'to', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'actor',
      type: 'string',
      options: {
        list: [
          {title: 'Agent — an automated actor may do this', value: 'agent'},
          {title: 'Person — a named human, and only a human', value: 'human'},
          {title: 'Either', value: 'either'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'requires',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Fields on the conflict that must be filled before this move is legal',
      options: {
        list: ['rationale', 'decidedBy', 'decidedAt', 'sides', 'nature', 'supersededBy'],
      },
    }),
    defineField({
      name: 'note',
      type: 'text',
      rows: 2,
      description: 'Why the rule is what it is — read by whoever is about to break it',
    }),
  ],
  preview: {
    select: {label: 'label', from: 'from', to: 'to', actor: 'actor'},
    prepare: ({label, from, to, actor}) => ({
      title: `${label}`,
      subtitle: `${from} → ${to} · ${actor}`,
    }),
  },
})
