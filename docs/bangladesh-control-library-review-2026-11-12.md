# Bangladesh control library sector-mapping review

**Review date:** 2026-11-12  
**Library reviewed:** BD-0.2-provisional  
**Controls reviewed:** 16  
**Disposition:** All controls remain `in_review`; none is approved or published.

## Verification conclusion

The 16 controls are directionally mapped to the requested sectors, but they are not sufficiently verified for approval or publication. The library currently combines international recommended practices, general Bangladesh government portals, and regulator portals. Those sources support assessment context, but they do not by themselves establish that a control is Bangladesh law or a mandatory sector obligation. The existing `not itself a legal requirement` label and provisional lifecycle must remain.

The strongest immediate issue is not the presence of a wrong sector label. It is that most labels are broader than the control objective, evidence requirement, lifecycle stage, or cited authority. The library needs a shared risk/materiality model, normalized sector taxonomy, lifecycle stage gates, and pinpoint source passages reviewed by qualified Bangladesh legal and sector reviewers.

## Control-by-control disposition

| Control | Sector mapping result | Required disposition |
|---|---|---|
| `BD-GOV-001` | Baseline governance ownership is logically cross-sector, but `all` lacks risk/materiality qualifiers and the evidence does not require named authority, decision rights, escalation, lifecycle gates, or implementation review. | Keep `in_review`; add proportionality, lifecycle checkpoints, accountable owner, decision rights, and sector overlays. |
| `BD-DATA-001` | Cross-sector mapping is defensible only when triggered by personal, sensitive, public-service, or operational data. `critical` and weight `1.25` are not risk-calibrated. | Keep `in_review`; add authorization/basis, provenance, notice, sharing, deletion, exceptions, sector tailoring, and risk tiers. |
| `BD-CYBER-001` | Security and incident response are logically cross-sector, but the operations-only lifecycle is too narrow and ICT Division is not a control-specific cyber authority. | Keep `in_review`; cover design through retirement, material change, testing, remediation, detection metrics, and sector cyber sources. |
| `BD-BANK-001` | Human oversight fits consequential financial decisions. Banking/NBFI coverage is plausible, but payment/fintech boundaries and the high criticality/weight rationale are unresolved. | Keep `in_review`; define consequentiality, institution boundaries, reviewer competence, validation, bias/drift, fallback, and pinpoint Bangladesh Bank review. |
| `BD-BANK-002` | Supplier/cloud risk fits financial services and procurement, but `financial_services` is undefined and the control mixes procurement with ongoing operations and exit. | Keep `in_review`; distinguish regulated entities from vendors, add post-award monitoring, subcontractors, incident, portability, deletion, and exit testing. |
| `BD-HEALTH-001` | Clinical safety mapping fits healthcare. `pharmaceuticals` is over-broad relative to the objective, which does not define clinical-trial, medical-product, pharmacovigilance, or patient-impact boundaries. | Keep `in_review`; narrow or split pharmaceutical scope, extend beyond decision stage, and add clinical validation, consent/notice, adverse-event escalation, and monitoring. |
| `BD-HEALTH-002` | Data access/retention fits sensitive health data, but applicability names public health and research while sector tags omit them. DGDA cannot cover the entire health perimeter. | Keep `in_review`; normalize healthcare/pharmaceutical/public-health/research taxonomy and add authorization, minimization, sharing, recertification, deletion, and impact assessment. |
| `BD-EDU-001` | Learner protection and appeal fit consequential education decisions. `research` is unexplained by the objective/applicability, and UGC does not cover schools, training, and all EdTech. | Keep `in_review`; separate education/research, add school/higher-education/EdTech overlays, child/privacy/fairness safeguards, and ongoing monitoring. |
| `BD-EDU-002` | The research objective is coherent for universities and research institutes, but `education` is over-broad and development-only lifecycle coverage is inadequate. | Keep `in_review`; cover the full research lifecycle and require provenance, consent/ethics, security, fairness, versioning, evaluation, disclosure, and reviewer criteria. |
| `BD-TELECOM-001` | Supplier assessment fits telecom procurement, but the control also applies to any external-AI user and includes a broad `technology` category. | Keep `in_review`; define telecom-material supplier scope, risk tiers, approval, subcontractors, continuity, exit, and specific BTRC requirements. |
| `BD-TELECOM-002` | Operations monitoring of network/customer-impacting AI is logically aligned. Material change, service metrics, rollback, customer/regulator escalation, and supplier boundaries are missing. | Keep `in_review`; add measurable service/customer indicators, drift, rollback, incident thresholds, remediation, and pinpoint BTRC sources. |
| `BD-GOV-002` | Government/public-service human escalation is well aligned, but the trigger, officer authority, appeal standards, lifecycle, and risk thresholds are unspecified. | Keep `in_review`; add impact thresholds, notice/appeal requirements, sampled outcomes, accessibility, and public-administration/legal review. |
| `BD-GOV-003` | Public-sector procurement mapping is coherent, but the sources are generic ICT/government portals rather than procurement instruments. | Keep `in_review`; add BPPA/PPR/e-GP and standard tender sources, supplier accountability, subcontractors, continuity, portability, deletion, and post-award review. |
| `BD-SME-001` | SME/startup baseline is proportionate, but `technology` is over-broad and no Bangladesh SME-specific authority or size threshold is mapped. | Keep `in_review`; define SME/startup boundaries, enhanced triggers for high-impact use, minimum testing, supplier/data/incident criteria, and specific sources. |
| `BD-PUBLIC-001` | Government/public-service accessibility and bilingual communication are relevant. `all` is over-broad without a rule, and the current sources do not verify a mandatory Bangla/English requirement. | Keep `in_review`; add WCAG/manual assistive-technology testing, language parity, affected-user feedback, alternative channels, lifecycle gates, and accessibility sources. |
| `BD-EMERGING-001` | Cross-sector traceability is coherent for material AI, but operations-only lifecycle and undefined materiality do not match model changes, decisions, incidents, and retirement. | Keep `in_review`; define materiality, log fields, retention/access, escalation, closure, and full lifecycle coverage. |

## Systemic mapping rules to implement before approval

1. **Normalize sector taxonomy.** Define whether `banking`, `nbfi`, `financial_services`, `payment`, and `fintech` are separate regulated categories. Define `healthcare`, `pharmaceuticals`, `public_health`, and `research`. Separate schools, higher education, training, EdTech, telecom operators, CSPs, infrastructure providers, suppliers, government agencies, local government, public bodies, and public-service providers. Define `sme`, `startup`, and `technology` boundaries rather than treating them as interchangeable.

2. **Introduce risk and materiality gates.** Applicability, criticality, weight, evidence depth, and escalation should depend on impact, data sensitivity, scale, essential-service dependence, regulated status, third-party dependency, and effects on individual rights or public access. This prevents identical treatment of low-risk internal prototypes and high-impact financial, clinical, telecom, or public-service systems.

3. **Use lifecycle stage gates consistently.** Controls should state whether they apply at design, procurement, validation, deployment, operations, material change, incident response, renewal, and retirement. A single label such as `decision`, `data`, or `operations` is insufficient where the evidence requirement spans multiple stages.

4. **Strengthen evidence requirements.** For higher-impact controls, evidence should normally include a named accountable owner, decision rights and escalation, qualified review, risk assessment, validation/testing, monitoring and drift results, incident records, remediation closure, retention/access controls, supplier/subcontractor oversight, continuity, portability, and secure deletion where relevant.

5. **Match source strength to claim strength.** UNESCO and NIST are international/recommended-practice references. ICT Division, National Portal, BTRC, DGDA, and UGC portals establish institutional context but are not automatically proof of a specific legal obligation. Add pinpoint Bangladesh instruments and record title, authority, URL, publication/effective status, reviewed passages, and whether the source is binding, guidance, policy, or recommended practice.

6. **Require qualified review before lifecycle promotion.** No control should move from `in_review` to `approved` or `published` until the relevant Bangladesh legal and sector reviewer confirms scope, authority, evidence sufficiency, criticality, weight, lifecycle coverage, and any sector overlay. Approval must not convert an assessment mapping into a legal requirement.

## Source references reviewed

The catalogue currently references the following official or primary pages. These links establish source context; they do not replace qualified legal or sector review:

- [Bangladesh Bank — Guideline on ICT Security, Version 4.0, 2023](https://www.bb.org.bd/aboutus/regulationguideline/brpd/jun192023_ictsecurityv4.pdf)
- [ICT Division, Government of Bangladesh](https://ictd.gov.bd/)
- [Directorate General of Drug Administration — policies](https://dgda.gov.bd/pages/policies)
- [University Grants Commission of Bangladesh](https://ugc.gov.bd/)
- [Bangladesh Telecommunication Regulatory Commission](https://btrc.gov.bd/)
- [Bangladesh National Portal](https://bangladesh.gov.bd/)
- [UNESCO Recommendation on the Ethics of Artificial Intelligence](https://www.unesco.org/en/artificial-intelligence/recommendation-ethics)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

**Safe disposition:** the 16-control library is suitable as a labelled, provisional assessment baseline. It is not yet a verified Bangladesh control library for legal, regulatory, certification, or independent-assurance claims.
