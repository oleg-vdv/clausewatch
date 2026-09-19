import {defineType, defineField} from 'sanity'

/**
 * The process, stored next to the content it governs.
 *
 * The point is the `actor` on each transition. An agent can gather the evidence for a
 * conflict and move it to review; it cannot sign it. A person can sign. Both move the
 * same document through the same named transitions, and the document records which of
 * them did what.
 *
 * Writing that rule here rather than in application code means the agent can read it —
 * `groq_query` returns the transitions it is allowed to take — instead of being trusted
 * to remember a rule from a prompt.
 */
export const workflow = defineType({
  name: 'workflow',
  title: 'Workflow',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}}),
    defineField({
      name: 'appliesTo',
      type: 'string',
      description: 'The document type this process governs',
      initialValue: 'conflict',
      readOnly: true,
    }),
    defineField({
      name: 'states',
      type: 'array',
      of: [{type: 'workflowState'}],
      validation: (r) => r.min(2),
    }),
    defineField({
      name: 'transitions',
      type: 'array',
      of: [{type: 'transition'}],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: {title: 'name', states: 'states', transitions: 'transitions'},
    prepare: ({title, states, transitions}) => ({
      title,
      subtitle: `${states?.length ?? 0} states · ${transitions?.length ?? 0} transitions`,
    }),
  },
})
