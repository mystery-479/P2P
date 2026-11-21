/**
 * CivicLens triage service — DEMO / RULE-BASED LOGIC, NOT AN AI MODEL.
 *
 * Person 2 owns this module. It is deliberately deterministic, offline and
 * explainable so the team can demo the full flow without API keys, and so a
 * real AI service can be swapped in later behind the same `triage()` contract.
 *
 * Capabilities:
 *  - language detection from Unicode script (Devanagari, Tamil, Telugu,
 *    Bengali, Kannada, Malayalam, Gujarati, Urdu) plus romanised clues
 *  - weighted, multilingual category classification with a confidence score
 *  - severity scoring with hazard, context and urgency signals, plus a
 *    one-line, human-readable reason
 *  - category -> department routing with an explicit manual-review fallback
 *  - low-confidence / unclear / non-English reporting flagged for review
 */

import {
  DEPARTMENTS,
  type ComplaintDraft,
  type TicketCategory,
  type TriageResult,
} from "../types/ticket.ts";

export type ConfidenceLevel = "high" | "medium" | "low";

/** Extends the shared contract with explainability metadata for the UI. */
export type TriageDetails = TriageResult & {
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  detectedLanguage: string;
  categoryScores: Partial<Record<TicketCategory, number>>;
  matchedSignals: string[];
};

type KeywordRule = [string, number];

type CategoryRule = {
  base: number;
  keywords: KeywordRule[];
};

type SignalRule = {
  variants: string[];
  points: number;
  reason: string;
  rank: number;
};

const CATEGORY_RULES: Record<Exclude<TicketCategory, "Other">, CategoryRule> = {
  Electricity: {
    base: 24,
    keywords: [
      ["streetlight", 7], ["street light", 7], ["street lamp", 7], ["lamp", 4],
      ["live wire", 9], ["exposed wire", 9], ["open wire", 8], ["wire", 5],
      ["wires", 5], ["electric", 5], ["electricity", 6], ["transformer", 7],
      ["short circuit", 8], ["spark", 6], ["sparks", 6], ["fuse", 4],
      ["power cut", 5], ["outage", 5], ["pole", 3], ["dark", 2],
      ["बिजली का तार", 9], ["नंगी तार", 9], ["तार", 4], ["बिजली", 6],
      ["लाइट", 5], ["खंभा", 4], ["ट्रांसफार्मर", 7], ["अंधेरा", 2],
      ["விளக்கு", 6], ["மின்சாரம்", 6], ["கம்பி", 5], ["மின்", 3],
      ["విద్యుత్", 6], ["తీగ", 5], ["దీపం", 5],
      ["বিদ্যুৎ", 6], ["তার", 5], ["বাতি", 5], ["بجلی", 6], ["تار", 5],
      ["bijli", 6], ["current", 3],
    ],
  },
  Roads: {
    base: 22,
    keywords: [
      ["pothole", 7], ["potholes", 7], ["gadgha", 6], ["gaddha", 6],
      ["cracked road", 6], ["broken road", 6], ["damaged road", 6],
      ["road", 3], ["roads", 3], ["trench", 4], ["dug up", 4],
      ["footpath", 4], ["pavement", 4], ["asphalt", 4], ["speed breaker", 3],
      ["traffic", 2], ["bus stop", 2], ["road marking", 2], ["pothol", 5],
      ["गड्ढा", 7], ["गड्ढे", 7], ["खड्डा", 7], ["सड़क", 4], ["सडक", 4],
      ["फुटपाथ", 4], ["मार्ग", 3], ["சாலை", 4], ["குழி", 7],
      ["குழிகள்", 7], ["రోడ్డు", 4], ["గొయ్యి", 7],
      ["রাস্তা", 4], ["গর্ত", 7], ["سڑک", 4], ["گڈھا", 7], ["रस्ता", 4],
    ],
  },
  Waste: {
    base: 18,
    keywords: [
      ["garbage", 7], ["trash", 6], ["rubbish", 6], ["waste", 6], ["dump", 6],
      ["dumping", 6], ["illegal dump", 7], ["dustbin", 5], ["bin", 2],
      ["litter", 4], ["foul smell", 5], ["stink", 5], ["rotten", 5],
      ["dead animal", 7], ["carcass", 8], ["sanitation", 3], ["cleaning", 2],
      ["plastic", 2], ["कचरा", 7], ["कूड़ा", 7], ["गंदगी", 5], ["डंप", 6],
      ["सफाई", 3], ["குப்பை", 7], ["கழிவு", 7], ["చెత్త", 7],
      ["ময়লা", 7], ["আবর্জনা", 7], ["کچرا", 7], ["kachra", 7],
    ],
  },
  Drainage: {
    base: 22,
    keywords: [
      ["drain", 7], ["drainage", 7], ["sewer", 7], ["sewage", 7],
      ["manhole", 7], ["open manhole", 9], ["waterlogging", 8],
      ["water logging", 8], ["waterlogged", 8], ["flood", 8], ["flooded", 8],
      ["blocked drain", 9], ["blocked", 4], ["clogged", 7], ["gutter", 6],
      ["nullah", 6], ["storm water", 7], ["stagnant", 6], ["inundation", 7],
      ["nali", 6], ["नाली", 7], ["नाला", 7], ["मैनहोल", 7], ["सीवर", 7],
      ["बाढ़", 8], ["जलभराव", 8], ["अवरुद्ध", 6], ["गंदा पानी", 6],
      ["கால்வாய்", 7], ["வடிகால்", 7], ["வெள்ளம்", 8],
      ["డ్రెయిన్", 7], ["కాలువ", 7], ["వరద", 8], ["নালা", 7],
      ["বন্যা", 8], ["জলাবদ্ধতা", 8], ["نالی", 7],
    ],
  },
  Water: {
    base: 20,
    keywords: [
      ["water", 3], ["leak", 6], ["leaking", 6], ["pipe", 5],
      ["burst pipe", 9], ["broken pipe", 8], ["tap", 4], ["supply", 3],
      ["no water", 6], ["water shortage", 6], ["low pressure", 5],
      ["drinking water", 6], ["contaminated", 7], ["brown water", 6],
      ["dirty water", 6], ["mixture", 4], ["tank", 3], ["filter", 2],
      ["पानी", 5], ["पेयजल", 6], ["नल", 5], ["पाइप", 5], ["रिसाव", 7],
      ["टूटा पाइप", 9], ["दूषित", 7], ["paani", 5],
      ["கசிவு", 7], ["குழாய்", 5], ["நீர்", 5], ["లీక్", 7],
      ["పైపు", 5], ["నీళ్లు", 5], ["ফাঁস", 7], ["পাইপ", 5], ["জল", 5],
      ["پانی", 5], ["رساو", 7],
    ],
  },
  Trees: {
    base: 18,
    keywords: [
      ["tree", 7], ["trees", 7], ["fallen tree", 9], ["tree fallen", 9],
      ["uprooted", 8], ["branch", 6], ["branches", 6], ["broken branch", 7],
      ["hanging branch", 8], ["dead tree", 6], ["roots", 4], ["pruning", 3],
      ["overgrown", 5], ["plant", 3], ["leaf", 2], ["leaves", 2],
      ["garden", 2], ["park", 2], ["ped", 5],
      ["पेड़", 7], ["पेड़ों", 7], ["गिरा पेड़", 9], ["पेड़ गिरा", 9],
      ["उखड़ा", 8], ["शाखा", 6], ["टहनी", 6], ["जड़", 4],
      ["மரம்", 7], ["கிளை", 6], ["చెట్టు", 7], ["కొమ్మ", 6],
      ["গাছ", 7], ["ডাল", 6], ["درخت", 7], ["شاخ", 6],
    ],
  },
};

const HAZARD_RULES: SignalRule[] = [
  { variants: ["electrocution", "electric shock", "झटका"], points: 45, reason: "electrocution / electric shock hazard", rank: 100 },
  { variants: ["live wire", "exposed wire", "open wire", "बिजली का तार", "नंगी तार", "nangi tar"], points: 40, reason: "exposed live wire — risk of electrocution", rank: 99 },
  { variants: ["gas leak", "chemical leak", "gas cylinder"], points: 38, reason: "gas or chemical leak", rank: 97 },
  { variants: ["fire", "flames", "burning", "smoke", "आग", "धुआं"], points: 32, reason: "fire or smoke hazard", rank: 95 },
  { variants: ["open manhole", "uncovered manhole", "खुला मैनहोल"], points: 32, reason: "open manhole — fall risk", rank: 93 },
  { variants: ["barbed wire"], points: 22, reason: "barbed-wire obstruction", rank: 92 },
  { variants: ["collapsed", "collapse", "ढह", "gir gaya"], points: 30, reason: "structural collapse", rank: 91 },
  { variants: ["injured", "injury", "accident", "हादसा", "चोट"], points: 27, reason: "injury or accident reported", rank: 89 },
  { variants: ["fallen tree", "tree fallen", "tree has fallen", "uprooted tree", "falling tree", "hanging branch", "गिरा पेड़"], points: 26, reason: "fallen or unstable tree/branch", rank: 85 },
  { variants: ["flood", "flooded", "waterlogging", "water logging", "बाढ़", "जलभराव", "बारिश के बाद पानी भर", "पानी भर गया", "भर गया है"], points: 23, reason: "flooding or severe waterlogging", rank: 83 },
  { variants: ["entering houses", "inside homes", "घरों में पानी"], points: 14, reason: "water entering homes", rank: 70 },
  { variants: ["sewage overflow", "overflowing sewage", "sewage", "गंदा पानी"], points: 23, reason: "sewage overflow", rank: 80 },
  { variants: ["contaminated", "brown water", "dirty water", "दूषित"], points: 22, reason: "contaminated drinking water", rank: 78 },
  { variants: ["burst pipe", "burst water pipe", "broken pipe", "टूटा पाइप", "रिसाव", "pipe burst", "पाइप फटा"], points: 20, reason: "burst or leaking pipe", rank: 74 },
  { variants: ["leaking continuously", "water is leaking", "लगातार रिसाव"], points: 11, reason: "continuous water leak", rank: 68 },
  { variants: ["short circuit", "spark", "sparks", "transformer", "ट्रांसफार्मर"], points: 18, reason: "electrical short-circuit or sparks", rank: 72 },
  { variants: ["deep pothole", "big pothole", "huge pothole", "swerving", "गहरा गड्ढा"], points: 17, reason: "deep pothole causing traffic danger", rank: 66 },
  { variants: ["dead animal", "carcass", "मृत जानवर"], points: 12, reason: "dead animal / carcass", rank: 60 },
  { variants: ["overflowing", "अतिप्रवाह", "over flows"], points: 8, reason: "overflowing / spilling over", rank: 52 },
  { variants: ["blocked", "obstructed", "अवरुद्ध", "clogged"], points: 8, reason: "passage or drain blocked", rank: 50 },
  { variants: ["no water", "water shortage", "पानी नहीं"], points: 9, reason: "water supply disruption", rank: 49 },
];

const CONTEXT_RULES: SignalRule[] = [
  { variants: ["school", "st. mary", "स्कूल", "विद्यालय", "பள்ளி", "స్కూల్"], points: 20, reason: "near a school", rank: 22 },
  { variants: ["hospital", "अस्पताल", "হাসপাতাল"], points: 20, reason: "near a hospital", rank: 22 },
  { variants: ["children", "child", "बच्चे", "बच्चा"], points: 12, reason: "with children nearby", rank: 18 },
  { variants: ["playground", "खेल का मैदान", "पार्क"], points: 8, reason: "near a playground", rank: 14 },
  { variants: ["bus stop", "बस स्टॉप", "pedestrian crossing", "फुटपाथ"], points: 7, reason: "at a busy public spot", rank: 13 },
  { variants: ["highway", "main road", "मुख्य मार्ग", "national highway"], points: 9, reason: "on a major road", rank: 12 },
  { variants: ["traffic", "ट्रैफिक", "ट्रैफ़िक", "oncoming"], points: 6, reason: "in a traffic-heavy area", rank: 11 },
  { variants: ["residential", "colony", "कॉलोनी", "लैन", "lane"], points: 4, reason: "in a residential area", rank: 9 },
];

const URGENCY_RULES: SignalRule[] = [
  { variants: ["urgent", "asap", "immediately", "emergency", "तुरंत", "जल्दी"], points: 12, reason: "marked urgent by the citizen", rank: 8 },
  { variants: ["for days", "for weeks", "for months", "since morning", "दिनों से", "हफ्तों से", "two weeks", "last two weeks", "three days"], points: 9, reason: "persisting for a long time", rank: 7 },
  { variants: ["danger", "dangerous", "hazard", "खतरा", "खतरनाक"], points: 8, reason: "described as dangerous", rank: 6 },
  { variants: ["many", "multiple", "several", "along", "पूरे", "सभी"], points: 4, reason: "affecting a wider area", rank: 5 },
];

const MITIGATION_VARIANTS = ["minor", "small", "slight", "cosmetic", "thoda", "थोड़ा", "no urgency", "not urgent", "little"];

const SCIPT_RANGES: Array<[number, number, string]> = [
  [0x0900, 0x097f, "Hindi/Devanagari"],
  [0x0b80, 0x0bff, "Tamil"],
  [0x0c00, 0x0c7f, "Telugu"],
  [0x0980, 0x09ff, "Bengali"],
  [0x0a80, 0x0aff, "Gujarati"],
  [0x0b00, 0x0b7f, "Odia"],
  [0x0d00, 0x0d7f, "Malayalam"],
  [0x0c80, 0x0cff, "Kannada"],
  [0x0600, 0x06ff, "Urdu"],
];

const ROMANISED_MARKERS = ["kachra", "paani", "bijli", "sadak", "gadgha", "gaddha", "nali", "ped", "nahi", "bahut", "rott", "jhatka"];

/** Normalise for matching: lowercase, collapse whitespace, strip punctuation. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectLanguage(text: string): string {
  const counts = new Map<string, number>();
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    for (const [start, end, name] of SCIPT_RANGES) {
      if (code >= start && code <= end) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
        break;
      }
    }
  }
  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  const lower = text.toLowerCase();
  const hits = ROMANISED_MARKERS.filter((marker) => lower.includes(marker)).length;
  return hits >= 2 ? "Romanised (Indian languages)" : "English";
}

function findMatches(haystack: string, variants: string[]): string[] {
  return variants.filter((variant) => haystack.includes(normalise(variant)));
}

function classifyCategory(text: string): {
  category: TicketCategory;
  confidence: number;
  scores: Partial<Record<TicketCategory, number>>;
  evidence: string[];
} {
  const scores: Partial<Record<TicketCategory, number>> = {};
  const evidence: Record<string, string[]> = {};

  for (const [category, rule] of Object.entries(CATEGORY_RULES) as Array<
    [Exclude<TicketCategory, "Other">, CategoryRule]
  >) {
    let score = 0;
    const hits: string[] = [];
    for (const [term, weight] of rule.keywords) {
      if (text.includes(normalise(term))) {
        score += weight;
        hits.push(term);
      }
    }
    scores[category] = score;
    evidence[category] = hits;
  }

  const ranked = (Object.keys(scores) as Array<Exclude<TicketCategory, "Other">>).sort(
    (a, b) => (scores[b] ?? 0) - (scores[a] ?? 0),
  );
  const winner = ranked[0];
  const winnerScore = scores[winner] ?? 0;
  const total = Object.values(scores).reduce((sum, value) => sum + (value ?? 0), 0);

  const category: TicketCategory = winnerScore >= 3 ? winner : "Other";
  const confidence = total === 0 ? 0.2 : Math.min(0.97, 0.42 + 0.55 * (winnerScore / total));

  const winnerEvidence = category === "Other" ? [] : evidence[winner] ?? [];
  return { category, confidence, scores, evidence: winnerEvidence.slice(0, 5) };
}

function assessSeverity(
  text: string,
  category: TicketCategory,
): { severity: TriageResult["severity"]; reason: string; signals: string[] } {
  const base = category === "Other" ? 26 : CATEGORY_RULES[category].base;
  let coreScore = base;
  let contextScore = 0;
  const reasons: Array<{ rank: number; text: string }> = [];
  const signals: string[] = [];
  let criticalHazard = false;
  let sensitiveContext = false;

  const apply = (rules: SignalRule[], isContext = false) => {
    for (const rule of rules) {
      const hits = findMatches(text, rule.variants);
      if (hits.length > 0) {
        if (isContext) {
          contextScore += rule.points;
          if (rule.rank >= 22) sensitiveContext = true;
        } else {
          coreScore += rule.points;
          if (rule.rank >= 82) criticalHazard = true;
        }
        signals.push(`+${rule.points} ${rule.reason} [${hits.join(", ")}]`);
        reasons.push({ rank: rule.rank, text: rule.reason });
      }
    }
  };

  apply(HAZARD_RULES);
  apply(CONTEXT_RULES, true);
  apply(URGENCY_RULES, true);

  const mitigation = findMatches(text, MITIGATION_VARIANTS);
  if (mitigation.length > 0) {
    coreScore -= 12;
    signals.push(`-12 minor impact [${mitigation.join(", ")}]`);
  }

  // Context can raise urgency but must not turn a routine issue into Critical.
  contextScore = Math.min(18, contextScore);
  const score = Math.max(1, Math.min(100, coreScore + contextScore));
  const severity: TriageResult["severity"] =
    coreScore >= 55 || (coreScore >= 40 && criticalHazard && sensitiveContext)
      ? "Critical"
      : score >= 46
        ? "High"
        : score >= 24
          ? "Medium"
          : "Low";

  reasons.sort((a, b) => b.rank - a.rank);
  const unique = [...new Set(reasons.map((item) => item.text))];
  let reason: string;
  if (unique.length === 0) {
    reason = category === "Other"
      ? "Complaint is too vague to classify — officer review recommended"
      : `Routine ${category.toLowerCase()} issue with no immediate hazard reported`;
  } else if (unique.length === 1) {
    reason = unique[0];
  } else {
    reason = `${unique[0]} — ${unique[1]}`;
  }
  reason = reason.charAt(0).toUpperCase() + reason.slice(1) + ".";

  return { severity, reason, signals: signals.slice(0, 8) };
}

/**
 * Triage a citizen complaint into a structured, explainable recommendation.
 * This is the single seam to replace with a real AI service later.
 */
export function triage(draft: ComplaintDraft): TriageDetails {
  const description = draft.description.trim();
  const text = normalise(description);
  const detectedLanguage = detectLanguage(description);
  const languageKnown = ["English", "Romanised (Indian languages)"].includes(detectedLanguage);

  const classification = classifyCategory(text);
  const assessment = assessSeverity(text, classification.category);

  const confidenceLevel: ConfidenceLevel =
    classification.confidence >= 0.7 ? "high" : classification.confidence >= 0.5 ? "medium" : "low";

  const needsReview =
    !languageKnown ||
    classification.category === "Other" ||
    confidenceLevel === "low" ||
    (text.split(" ").length < 8 && !draft.photoUrl);

  return {
    category: classification.category,
    severity: assessment.severity,
    severityReason: assessment.reason,
    department: needsReview && classification.category === "Other"
      ? DEPARTMENTS.Other
      : DEPARTMENTS[classification.category],
    needsReview,
    confidence: classification.confidence,
    confidenceLevel,
    detectedLanguage,
    categoryScores: classification.scores,
    matchedSignals: assessment.signals,
  };
}

/** Public alias kept so the previous module name keeps working for teammates. */
export const triageComplaint = triage;
