# Practice: Field Note  ·  `status: draft`

**Purpose** — turn messy customer/operator/research notes into durable structured state.

Field notes, voice memos, and raw customer notes are high-value signal that usually
evaporates. This Practice captures **who / where / when**, preserves **verbatim**
quotes (especially objections and exact words — not paraphrase), and extracts insights,
open questions, and follow-up candidates into durable state.

> Draft spec. Not yet implemented as an extension. See `practice.yaml`.

## Invocation

```txt
/field-note capture <raw note>
```

## Trigger

- a raw customer / operator / user note
- a voice memo or post-meeting brain dump
- a research observation worth keeping

## Inputs

- the raw note · source/context (office, person, role, date)

## Outputs / state

Durable under `field-notes/`: raw note (as-is), source/context, **exact quotes**,
entities, insights, open questions, follow-up candidates, memory writeback suggestions.

## Guardrails

- Capture **verbatim signal, not paraphrase** — especially objections and exact words.
- Log each objection and the counter to try next time.
- Draft and **stage** the one next follow-up touch — **never auto-send**.
- Boundary: the office/customer decides; we only record.

## Requiredness read

Apply the field test: would this office stop a covered instruction on a busy Friday
without the current record? What is the smallest version they would actually use?

## Evidence standard

Who/where/when captured, exact quotes preserved, at least one insight or open question,
and one staged (not sent) follow-up candidate.

## Handoff

Follow-up candidates feed the **Follow-up** Practice, which drafts the gated touch.

## Templates

- `templates/field-note.md`
