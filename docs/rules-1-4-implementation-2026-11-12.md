# Bangladesh catalogue rules 1–4 implementation

Implemented in catalogue version `BD-0.3-provisional`.

## Rule 1 — Normalized sector taxonomy

The catalogue uses a closed `BangladeshSector` union instead of free-form sector tags. The primary-sector context options now also include agriculture, energy/utilities, transportation, manufacturing, retail/e-commerce, media/journalism, insurance, legal/justice, and other sectors, as requested for future coverage. These additional options are not evidence that Bangladesh-specific controls exist for those sectors.

The 16 provisional controls retain only their explicit sector applicability tags; unmatched sectors receive only the cross-sector controls, not inferred sector overlays. Ambiguous values such as `financial_services` and `education` were removed from control records. The public control-registry API reports version `BD-0.3-provisional`.

## Rule 2 — Risk and materiality gates

Every control now carries a `riskGate` with a minimum risk tier, materiality triggers, and a proportionality rule. The trigger set covers regulated entities, high-impact decisions, sensitive data, essential services, third-party dependency, public-service exposure, external exposure, large-scale use, and research-participant impact.

The gate explicitly requires escalation when a trigger is present. Criticality and weighting remain catalogue signals rather than opaque scores; qualified reviewers must confirm the final calibration before approval or publication.

## Rule 3 — Lifecycle-stage coverage

Every control now carries `lifecycleStages` covering, as applicable, design, data, development, procurement, validation, deployment, decision, operations, material change, incident response, renewal, and retirement. The verifier requires at least design and operations coverage so stage-specific labels such as `data`, `decision`, or `procurement` cannot silently omit ongoing governance.

## Rule 4 — Minimum evidence requirements

Every control now carries structured `evidenceRequirements` in addition to its human-readable evidence description. All controls require an accountable owner, risk assessment, decision rights, qualified review, audit log, and remediation closure. Governance, data, security, assurance, and human-impact controls receive additional evidence requirements appropriate to their type, such as policy/procedure, data inventory/provenance, access/retention, validation/testing, monitoring/drift, incident/escalation, notice/appeal, training/competence, supplier/contract, and continuity/exit.

## Validation

Latest verification after the sector-relevance increment: `pnpm check` passed; `pnpm catalog:verify:bangladesh` passed for all 16 controls and 8 sources; `pnpm test` passed with 52 tests and 3 authenticated staging tests skipped; `pnpm build` passed. No control was promoted from `in_review`, and these rules do not turn an assessment mapping into a legal requirement.
