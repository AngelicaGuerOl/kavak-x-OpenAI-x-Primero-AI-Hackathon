# Synthetic document corpus 1

Six fictitious dossiers, 24 pages, 6 PDFs and 24 PNGs. Original layouts;
no government forms/logos or valid official identifiers. Every page is marked
SINTÉTICO — SIN VALIDEZ OFICIAL. Dates are evaluated at 2026-11-09.

| Suite | Case | Intended scenario |
| --- | --- | --- |
| discovery | doc-discovery-clean | Complete and consistent |
| discovery | doc-discovery-rfc | Different declared/fiscal RFC-DEMO values |
| validation | doc-validation-expired | Identity expired on 2026-10-31 |
| validation | doc-validation-no-address | No address document |
| holdout | doc-holdout-income-missing | Income amount explicitly absent |
| holdout | doc-holdout-income-conflict | Same-period incomes of 18000 and 9000 MXN |

`cases.json` fixes visible document content. `tests/documents/oracles.json` fixes
field-level expected values, absence, cross-document contradictions and findings.
Both were authored and expectations registered with `rsi_history.py case` before
rendering. OCR receives artifacts only, never these expectations. Case and suite
names and filenames must also be hidden from a future OCR prompt to avoid hints.

The authenticated real API probe in `api-check.json` used gpt-6-luna to select only
an allowlisted color and layout. It was not sent fixture values or oracles.
PDF/PNG rendering was local and deterministic, not AI image generation. The
renderer never runs model-generated code or interprets HTML supplied by a model.
`manifest.json` records SHA-256 hashes, pages, generator version and actual mode.
SQLite `synthetic_document_artifacts` also records each artifact, oracle and suite.

Visible text on all 24 PDF pages was checked with pdftotext against the prewritten
oracle. All rendered pages were visually inspected via case contact sheets.
This is an artifact integrity check, NOT model OCR accuracy. There has been no
OCR extraction on this corpus and no RSI lesson has been accepted from it.
All images are clean digital renderings; low-quality/illegibility cases remain
future work. Credit-bureau consent is false and no bureau tool is invoked.

To reproduce into a NEW artifact location (the generator refuses overwrites):
install reportlab and Pillow; provide pdftotext and pdftoppm, preserve registered
oracles and the allowlisted API appearance result; run
`python3 scripts/generate_synthetic_documents.py`. The directory must be empty.
Downloads are copied under `output/pdf/synthetic-documents` and zipped at
`output/synthetic-documents.zip`; source bytes are preserved with the fixtures.

Next: build isolated OCR extraction with Zod, field/page/evidence and explicit
absent/illegible/contradictory states, then evaluate before connecting it to KYC.
