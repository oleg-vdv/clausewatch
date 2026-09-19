import {defineType, defineField} from 'sanity'

/**
 * A regulatory instrument as a whole: the AI Act, an ISO standard, a national law.
 * Everything an agent cites must resolve to one of these, so the user can go read it.
 */
export const source = defineType({
  name: 'source',
  title: 'Source',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'shortName',
      type: 'string',
      description: 'How the agent should cite it inline, e.g. "EU AI Act"',
      validation: (r) => r.required(),
    }),
    defineField({name: 'slug', type: 'slug', options: {source: 'shortName'}}),
    defineField({
      name: 'jurisdiction',
      type: 'reference',
      to: [{type: 'jurisdiction'}],
      validation: (r) => r.required(),
    }),
    defineField({name: 'authority', type: 'string', description: 'Body that issued it'}),
    defineField({
      name: 'bindingStatus',
      type: 'string',
      options: {
        list: [
          {title: 'Binding law', value: 'law'},
          {title: 'Standard (voluntary, may be presumed-conformity)', value: 'standard'},
          {title: 'Regulator guidance', value: 'guidance'},
          {title: 'Draft / not yet in force', value: 'draft'},
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({name: 'officialUrl', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'adoptedOn', type: 'date'}),
    defineField({
      name: 'versionLabel',
      type: 'string',
      description: 'Consolidated text date or standard edition — conflicts are often just version skew',
    }),
    defineField({
      name: 'knowledgeBaseSourceId',
      type: 'string',
      description: 'Ties this document to the crawled prose in the Knowledge Base',
    }),
  ],
  preview: {
    select: {title: 'shortName', subtitle: 'bindingStatus'},
  },
})
