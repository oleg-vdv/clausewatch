/**
 * The control experiment.
 *
 * The brief says the strongest submissions show an agent that only works because the
 * content was structured, and that if a keyword search would have got you the same
 * answer you should aim higher. That is a falsifiable claim, so this runs the other
 * arm of it: the same question, the same corpus, scored the way a search box would.
 *
 * It is deliberately not a straw man. Real term weighting, real ranking, the verbatim
 * clause text the knowledge base is built from. It finds the right paragraph. What it
 * cannot do is the point — and what it cannot do is structural, not a tuning problem.
 */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'do', 'for', 'from', 'how', 'i', 'in', 'is',
  'it', 'long', 'must', 'my', 'of', 'on', 'or', 'our', 'that', 'the', 'their', 'this', 'to',
  'was', 'we', 'what', 'when', 'which', 'with', 'you', 'your',
])

const terms = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9()]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))

export interface Passage {
  cite: string
  heading: string | null
  text: string
  score: number
}

/**
 * Classic tf-idf over the clause texts. Nothing clever, nothing crippled: this is
 * roughly what a search box on the same documents would give you.
 */
export function search(passages: Array<Omit<Passage, 'score'>>, question: string): Passage[] {
  const query = terms(question)
  const docs = passages.map((p) => terms(`${p.heading ?? ''} ${p.text}`))

  const df = new Map<string, number>()
  for (const doc of docs) {
    for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1)
  }

  return passages
    .map((passage, i) => {
      const doc = docs[i] ?? []
      let score = 0
      for (const term of query) {
        const tf = doc.filter((t) => t === term).length
        if (!tf) continue
        const idf = Math.log(1 + passages.length / (df.get(term) ?? 1))
        score += (tf / doc.length) * idf
      }
      return {...passage, score}
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * What the ranking cannot express, stated as questions rather than as a verdict.
 * Each one is answered by a relationship between documents, which is exactly the
 * thing a flat index of those documents does not hold.
 */
export const BLIND_SPOTS = [
  'Do these two clauses contradict each other, or is the second one just also relevant?',
  'Which of them binds me — am I the provider here, or the deployer?',
  'Is this obligation in force yet, and from which date?',
  'Has anyone decided what to do where they collide, and who was it?',
]
