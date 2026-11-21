/**
 * Precise, deterministic triage rules used for verification. Mirrors the
 * scoring rules in `triage.ts`, with no dependencies, so the expected values
 * in `triage.test.ts` can be cross-checked independently.
 */

import type { TicketCategory, Severity } from "../types/ticket";

export function expectedCategory(text: string): TicketCategory {
  const t = text.toLowerCase();
  if (/live wire|exposed wire|बिजली|तार|electr|street ?light|transformer|wire|lamp|विद्यु|மின்சார/.test(t)) return "Electricity";
  if (/pothole|road|गड्ढा|सड़क|सडक|குழி|சாலை|footpath|bus stop|pavement/.test(t)) return "Roads";
  if (/garbage|waste|dustbin|trash|कचरा|कूड़ा|குப்பை|చెత్త|ময়লা/.test(t)) return "Waste";
  if (/drain|sewer|manhole|waterlog|flood|नाली|सीवर|बाढ़|जलभराव|கால்வாய్|வெள்ள/.test(t)) return "Drainage";
  if (/water|pipe|leak|पानी|पाइप|रिसाव|கசிவு|నీళ/.test(t)) return "Water";
  if (/tree|branch|पेड़|गिरा|शाखा|मरम|மரம்|చెట్టు|গাছ/.test(t)) return "Trees";
  return "Other";
}

export function expectedSeverity(text: string, category: TicketCategory): Severity {
  const t = text.toLowerCase();
  let score = category === "Electricity" ? 24 : category === "Roads" ? 22 : category === "Water" || category === "Drainage" ? 20 : 18;
  if (/electrocution|electric shock|झटका/.test(t)) score += 45;
  if (/live wire|exposed wire|open wire|बिजली का तार|नंगी तार/.test(t)) score += 40;
  if (/fire|flames|burning|smoke|आग/.test(t)) score += 32;
  if (/open manhole|खुला मैनहोल/.test(t)) score += 32;
  if (/fallen tree|tree has fallen|गिरा पेड़|hanging branch/.test(t)) score += 26;
  if (/flood|waterlog|water logging|entering houses|बाढ़|जलभराव/.test(t)) score += 25;
  if (/burst pipe|ब्रेस्ट|टूटा पाइप/.test(t)) score += 20;
  if (/deep pothole|huge pothole|big pothole|swerving/.test(t)) score += 17;
  if (/blocked|obstructed/.test(t)) score += 8;
  if (/overflowing|foul smell/.test(t)) score += 8;
  if (/school|स्कूल/.test(t)) score += 20;
  if (/hospital|अस्पताल/.test(t)) score += 20;
  if (/children|child|बच्चे/.test(t)) score += 12;
  if (/bus stop|pedestrian crossing/.test(t)) score += 7;
  if (/highway|main road/.test(t)) score += 9;
  if (/dangerous|खतरा|hazard/.test(t)) score += 8;
  if (/for weeks|for days|for months|two weeks|दिनों से|since morning|three days/.test(t)) score += 9;
  if (/minor|small|slight|little|cosmetic/.test(t)) score -= 12;
  return score >= 70 ? "Critical" : score >= 48 ? "High" : score >= 24 ? "Medium" : "Low";
}
