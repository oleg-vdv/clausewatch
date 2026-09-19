import {defineType, defineField} from 'sanity'

export const workflowState = defineType({
  name: 'workflowState',
  title: 'State',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      type: 'string',
      description: 'Stored on the conflict. Lowercase, hyphenated.',
      validation: (r) => r.required().regex(/^[a-z][a-z0-9-]*$/, {name: 'lowercase and hyphens'}),
    }),
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'description', type: 'text', rows: 2}),
    defineField({
      name: 'isTerminal',
      type: 'boolean',
      description: 'Nothing leaves this state except by superseding the document',
      initialValue: false,
    }),
  ],
  preview: {
    select: {title: 'title', key: 'key', terminal: 'isTerminal'},
    prepare: ({title, key, terminal}) => ({
      title,
      subtitle: [key, terminal ? 'terminal' : null].filter(Boolean).join(' · '),
    }),
  },
})
