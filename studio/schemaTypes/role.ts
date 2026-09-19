import {defineType, defineField} from 'sanity'

/**
 * Provider / deployer / importer / distributor. Which one you are changes the entire
 * obligation set, and the same word means different things in different instruments —
 * which is why it is a document, not a string enum.
 */
export const role = defineType({
  name: 'role',
  title: 'Role',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'definedIn', type: 'reference', to: [{type: 'provision'}]}),
    defineField({name: 'description', type: 'text', rows: 3}),
    defineField({
      name: 'equivalentTo',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'role'}]}],
      description: 'Near-synonyms across instruments. "Near" is doing work here; see conflicts.',
    }),
  ],
  preview: {select: {title: 'name'}},
})
