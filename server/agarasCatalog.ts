export const GAAF_DOMAINS = [
  ["D01", "AI Literacy & Human Capability"], ["D02", "AI Strategy & Leadership"], ["D03", "Digital & Compute Infrastructure"], ["D04", "Data Readiness & Governance"], ["D05", "AI Adoption & Operational Integration"], ["D06", "AI Governance & Institutional Oversight"], ["D07", "AI Risk Management"], ["D08", "Responsible AI & Ethics"], ["D09", "Privacy & Data Protection"], ["D10", "AI Security & Resilience"], ["D11", "Legal & Regulatory Readiness"], ["D12", "AI System Quality & Reliability"], ["D13", "Human Rights & Societal Impact"], ["D14", "AI Procurement & Third-Party Risk"], ["D15", "Workforce Transformation"], ["D16", "Innovation & Research Capacity"], ["D17", "AI Economics & Financial Sustainability"], ["D18", "Monitoring, Evaluation & Assurance"], ["D19", "Environmental Sustainability"], ["D20", "AI Sovereignty & Ecosystem Resilience"],
] as const;

export const STARTER_CONTROLS = [
  ["GAAF-D01-001", "D01", "AI literacy baseline", "People using AI have a documented baseline of knowledge, verification and responsible-use skills."],
  ["GAAF-D02-001", "D02", "AI strategy ownership", "The organization has a documented AI strategy with accountable leadership."],
  ["GAAF-D04-001", "D04", "Data stewardship", "Data sources, owners, quality rules and retention requirements are documented."],
  ["GAAF-D06-001", "D06", "AI governance accountability", "AI governance roles, decision rights and incident escalation are formally assigned."],
  ["GAAF-D07-001", "D07", "AI risk register", "AI risks are identified, assessed, owned and reviewed through a maintained register."],
  ["GAAF-D08-001", "D08", "Responsible AI review", "Fairness, transparency, explainability and human-impact considerations are assessed."],
  ["GAAF-D09-001", "D09", "Privacy impact assessment", "Privacy and data protection implications are assessed before deployment."],
  ["GAAF-D10-001", "D10", "AI security controls", "Security threats, access controls, monitoring and resilience requirements are documented."],
  ["GAAF-D11-001", "D11", "Legal applicability review", "Applicable legal and regulatory obligations are identified and reviewed for the use case."],
  ["GAAF-D12-001", "D12", "System validation", "AI system performance, limitations, robustness and validation evidence are maintained."],
  ["GAAF-D14-001", "D14", "Third-party AI due diligence", "Vendors, contracts, model dependencies and supply-chain risks are reviewed."],
  ["GAAF-D18-001", "D18", "Continuous monitoring", "AI performance, incidents, changes and corrective actions are monitored over time."],
] as const;

export const PROFILE_DOMAIN_COUNTS = { individual: 9, organization: 14, enterprise: 18, government: 20, national: 20 } as const;
export const PROFILE_CONTROL_LIMITS = { individual: 5, organization: 8, enterprise: 15, government: 20, national: 20 } as const;
