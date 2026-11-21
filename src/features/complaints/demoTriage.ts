/**
 * Compatibility shim — the real Person 2 triage service now lives in
 * `src/lib/triage.ts`. Kept so teammates with older imports are not broken.
 *
 * The implementation is DEMO keyword rules, not an AI model.
 */

export { triage, triageComplaint } from "../../lib/triage";
export type { TriageDetails, ConfidenceLevel } from "../../lib/triage";
