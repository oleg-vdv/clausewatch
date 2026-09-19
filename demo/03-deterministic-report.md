
> clausewatch-agent@0.1.0 ask
> tsx src/cli.ts --profile biometric-access --no-llm

# Biometric access control for a logistics hub
Face matching against an employee reference database at site entrances. Built in Kazakhstan, deployed at a client site in Poland.
Role: Provider · Risk class: high · Jurisdictions in scope: KZ, EU

## Determine whether the product falls under Annex I harmonisation legislation

- MUST: A system is high-risk where it is a safety component of, or is itself, a product covered by Annex I legislation that needs third-party conformity assessment. — EU AI Act Art. 6 <https://artificialintelligenceact.eu/article/6/>
  Applies when: Turns on whether your product type appears in Annex I at all.

- MUST: Annex I lists twenty live items under a numbering that runs to 21, because item 1 was deleted and item 21 added by amendment. — EU AI Act Annex I <https://artificialintelligenceact.eu/annex/1/>
  Applies when: Machinery is the affected case: Directive 2006/42/EC was replaced by Regulation (EU) 2023/1230.

**Decided.** Annex I numbering runs to 21 but only 20 items are live after the machinery amendment
Sides: EU AI Act Annex I  |  EU AI Act Art. 6
Resolution: corrected — Oleg Vdovin on 2026-09-19
> Sanity Context raised this while indexing: an entry stated Annex I lists 21 instruments, and the source shows 20. Verified against artificialintelligenceact.eu on 2026-09-19 — the numbering does run 1 to 21, item 1 (Directive 2006/42/EC) is struck and item 21 (Regulation (EU) 2023/1230) is added, leaving 20 live items. Cite instruments, not item numbers. Note that Context also proposed a Section A / Section B split of 12 and 8; that part is NOT verified here, because the official EUR-Lex text could not be retrieved, and it is deliberately left out of this record. The detection was right and its arithmetic was not independently confirmed — which is why this decision carries a name.

Evidence an auditor asks for: Name the Annex I item your product falls under, by instrument, not by item number. Numbers move when the annex is amended; the instrument does not.

## Retain automatically generated logs

How long:
- Floor: at least 6 months — EU AI Act Art. 19 [binds the Provider], in force from 2027-12-02 <https://artificialintelligenceact.eu/article/19/>
  Applies when: Provider role; logs under the provider's control; applies from 2 Dec 2027 for Annex III systems.
- Ceiling: no fixed number; it caps the period by necessity — GDPR Art. 5(1)(e), in force from 2018-05-25 <https://eur-lex.europa.eu/eli/reg/2016/679/oj>
  Applies when: Any log containing personal data. Art. 12(3) makes this unavoidable for biometric systems.
- These push in opposite directions. The answer is a retention period you can justify against both, not a single number either text states.

- MUST: The system must be technically capable of recording events automatically across its lifetime. — EU AI Act Art. 12(1) [binds the Provider] <https://artificialintelligenceact.eu/article/12/>
  Applies when: High-risk systems only.
  This clause imposes the duty and says nothing about how long. That silence is the clause, not a gap in the data.

**Unresolved conflict.** AI Act sets a six-month floor for log retention; GDPR sets a necessity ceiling on the same logs
Sides: EU AI Act Art. 19  |  GDPR Art. 5(1)(e)
No one has decided this yet. It needs a named decision from whoever owns compliance for this system — the dataset records who and when, and this field is empty.

Evidence an auditor asks for: A retention schedule naming the six-month floor, the purpose justifying the chosen period, and the deletion mechanism that enforces the ceiling. Auditors ask for the schedule and a sample deletion record, not a policy statement.
