import type {StructureResolver} from 'sanity/structure'

/**
 * The default document-type list would bury the one thing an editor of this dataset
 * actually does: work through unresolved conflicts. So open conflicts come first, and
 * requirements are grouped by topic rather than listed alphabetically.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('ClauseWatch')
    .items([
      S.listItem()
        .title('Conflicts')
        .child(
          S.list()
            .title('Conflicts')
            .items([
              S.listItem()
                .title('Open — need a decision')
                .child(
                  S.documentList()
                    .title('Open conflicts')
                    .filter('_type == "conflict" && resolution == "open"'),
                ),
              S.listItem()
                .title('Decided')
                .child(
                  S.documentList()
                    .title('Decided conflicts')
                    .filter('_type == "conflict" && defined(resolution) && resolution != "open"'),
                ),
              S.documentTypeListItem('conflict').title('All conflicts'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Requirements by topic')
        .child(
          S.list()
            .title('Topics')
            .items(
              [
                ['classification', 'Scope & classification'],
                ['logging', 'Logging & record-keeping'],
                ['risk', 'Risk management'],
                ['oversight', 'Human oversight'],
                ['transparency', 'Transparency & disclosure'],
                ['data', 'Data governance'],
                ['monitoring', 'Post-market monitoring'],
                ['incident', 'Incident reporting'],
              ].map(([value, title]) =>
                S.listItem()
                  .id(value)
                  .title(title)
                  .child(
                    S.documentList()
                      .title(title)
                      .filter('_type == "requirement" && topic == $topic')
                      .params({topic: value}),
                  ),
              ),
            ),
        ),

      S.documentTypeListItem('systemProfile').title('System profiles'),

      S.divider(),

      S.listItem()
        .title('Corpus')
        .child(
          S.list()
            .title('Corpus')
            .items([
              S.documentTypeListItem('source').title('Sources'),
              S.documentTypeListItem('provision').title('Provisions'),
              S.documentTypeListItem('role').title('Roles'),
              S.documentTypeListItem('jurisdiction').title('Jurisdictions'),
            ]),
        ),
    ])
