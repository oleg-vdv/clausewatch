# Corpus plan — what goes into the Knowledge Base

Rule: only publicly reachable text. The dataset has to be public for the submission
(project ID / public dataset URL is mandatory), so nothing licensed goes in.

| # | Instrument | Binding | Crawlable | URL | Status |
|---|---|---|---|---|---|
| 1 | Regulation (EU) 2024/1689 — AI Act | law | yes, HTML | https://eur-lex.europa.eu/eli/reg/2024/1689/oj | primary source |
| 2 | Regulation (EU) 2016/679 — GDPR | law | yes, HTML | https://eur-lex.europa.eu/eli/reg/2016/679/oj | primary source |
| 3 | NIST AI RMF 1.0 (AI 100-1) | guidance | yes, PDF | https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf | to verify |
| 4 | NIST Generative AI Profile (AI 600-1) | guidance | yes, PDF | https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf | to verify |
| 5 | Kazakhstan AI law 230-VIII | law | check adilet.zan.kz | — | **URL unconfirmed** |
| 6 | ISO/IEC 42001:2023 | standard | **no — paywalled** | — | reference only: clause numbers, never the text |

## Verified facts (checked 2026-09-19)

**AI Act Art. 12 — Record-keeping.** Three paragraphs. High-risk systems must technically
allow automatic recording of events over the system lifetime; logs must cover situations
that risk malfunction or substantial modification, post-market monitoring, and operational
compliance. Art. 12(3) sets a minimum log content for biometric identification systems
(Annex III 1(a)): start and end time of each use, the reference database checked, the input
data matched, and **the identity of the persons verifying the results**.
**Art. 12 states no retention period at all.**

**AI Act Art. 19 — Automatically generated logs.** Binds **providers**. Logs under their
control must be kept for a period "appropriate to the intended purpose", and **at least six
months, unless provided otherwise in the applicable Union or national law**. Financial
institutions under Union financial services law may keep them inside the documentation that
law already requires. Applies from **2 Dec 2027** (Annex III high-risk) or **2 Aug 2028**
(Annex I high-risk).

## The flagship conflict (real, not manufactured)

**AI Act Art. 19 requires keeping logs for at least six months. GDPR Art. 5(1)(e) requires
keeping personal data no longer than necessary for the purpose.** Art. 12(3) guarantees the
collision rather than merely allowing it: for biometric systems the log is *required* to
contain the identity of the verifying persons, so the mandated log is personal data by
construction. One instrument sets a floor, the other a ceiling, and nothing in either text
tells you where the other one sits.

That is the demo. The model holds both claims against one requirement with their citations;
the `conflict` document records that they collide, and what was decided, by whom, and why.
A keyword search for "log retention" returns Art. 19 and stops — it has no way to know that
a clause in a different regulation constrains the same artifact from the other direction.

## Secondary candidates

1. **Deadline skew inside one instrument.** Art. 19 bites on 2 Dec 2027 for Annex III
   systems and 2 Aug 2028 for Annex I. Same obligation, two dates, decided by which annex
   your system falls under — a `deadline` conflict that a profile resolves.
2. **Provider vs deployer.** A company that fine-tunes a third-party model can be a deployer
   under one reading and a provider under another; the role flips the whole obligation set.
   `scope` conflict, and the highest-impact one.
3. **Agentic action logs.** No instrument here was drafted for tool-calling agents. Expect
   silence, not contradiction — and silence reported as silence, with citations showing
   where the text stops, is a better answer than a confident guess.

## ISO note

Clause numbers and titles of ISO/IEC 42001 are citable; the text is not redistributable.
Model it as a `source` with `bindingStatus: standard` whose provisions carry citation and
heading but empty `text`. The agent must say "this clause exists, here is what it governs,
the text is behind a paywall" rather than inventing a paraphrase.
