---
name: pdf
description: Generate or inspect PDF artifacts — HTML-first; no ReportLab.
---

# PDF skill (stub)

## Triggers

- export pdf, print to pdf, one-pager pdf

## Constraints

- Prefer HTML → print/PDF pipeline used elsewhere in repo
- Do not introduce ReportLab
- Receipt must reference output path

## Autonomy

- `pdf.generate`: yellow
- `pdf.publish`: red
