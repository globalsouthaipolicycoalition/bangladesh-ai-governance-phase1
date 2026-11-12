export const AI_SYSTEM_DECISION_IMPACTS = ["informational", "advisory", "decision_support", "automated_decision"] as const;
export const AI_SYSTEM_LIFECYCLE_STATUSES = ["discovery", "planned", "development", "pilot", "production", "retired"] as const;
export type AISystemDecisionImpact = typeof AI_SYSTEM_DECISION_IMPACTS[number];
export type AISystemLifecycleStatus = typeof AI_SYSTEM_LIFECYCLE_STATUSES[number];
