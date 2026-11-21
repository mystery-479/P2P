/**
 * Lightweight, dependency-free checks for the triage service.
 * Run with: npm run test:triage
 *
 * These assertions intentionally cover the acceptance scenarios from the
 * project README: multilingual input, each category, safety-critical severity,
 * low-severity mitigation and the unclear-complaint review fallback.
 */

import { triage } from "./triage.ts";

type Case = {
  name: string;
  text: string;
  category: string;
  severity?: string;
  needsReview?: boolean;
  language?: string;
};

const cases: Case[] = [
  {
    name: "exposed live wire near a school is Critical Electricity",
    text: "Exposed live wire lying on the footpath outside St. Mary's school. Children walk here every morning — extremely dangerous!",
    category: "Electricity",
    severity: "Critical",
  },
  {
    name: "bus-stop pothole is High Roads",
    text: "Huge pothole on the main road near the bus stop. Two-wheelers are swerving into oncoming traffic for weeks.",
    category: "Roads",
    severity: "High",
  },
  {
    name: "overflowing garbage is Waste",
    text: "Garbage has not been collected for four days and the dustbin is overflowing near the market with a foul smell.",
    category: "Waste",
    severity: "Medium",
  },
  {
    name: "burst pipe is Water",
    text: "Burst water pipe on 12th Cross, water is leaking continuously since morning.",
    category: "Water",
    severity: "High",
  },
  {
    name: "fallen tree is Trees and Critical near a hospital",
    text: "A large tree has fallen and is blocking the highway right outside the hospital, traffic is stuck.",
    category: "Trees",
    severity: "Critical",
  },
  {
    name: "blocked drain flooding homes is Drainage",
    text: "The drain is blocked and water is entering houses in our lane after the rain. It has been like this for three days.",
    category: "Drainage",
    severity: "High",
  },
  {
    name: "minor water leak is Low",
    text: "There is a small water leak from the pipe on our street, the road is a little wet. It is minor.",
    category: "Water",
    severity: "Low",
  },
  {
    name: "Hindi pothole is classified and flagged for review",
    text: "सड़क पर बड़ा गड्ढा है, बारिश के बाद पानी भर गया है। पास ही स्कूल है, बच्चों को दिक्कत हो रही है।",
    category: "Roads",
    severity: "Critical",
    needsReview: true,
    language: "Hindi/Devanagari",
  },
  {
    name: "Tamil road complaint is classified and flagged for review",
    text: "சாலையில் குழி உள்ளது; பேருந்து நிறுத்தத்திற்கு அருகில் உள்ளதால் விபத்து ஏற்படும் அபாயம் உள்ளது.",
    category: "Roads",
    needsReview: true,
    language: "Tamil",
  },
  {
    name: "unclear complaint goes to manual review",
    text: "Something is wrong near the bridge but I cannot describe it clearly.",
    category: "Other",
    severity: "Medium",
    needsReview: true,
    language: "English",
  },
];

let passed = 0;
let failures = 0;
for (const testCase of cases) {
  const result = triage({
    description: testCase.text,
    language: "English",
    location: "Test street",
    locality: "Test locality",
    ward: "Ward 1",
  });
  const problems: string[] = [];
  if (result.category !== testCase.category) problems.push(`category: expected ${testCase.category}, got ${result.category}`);
  if (testCase.severity && result.severity !== testCase.severity) problems.push(`severity: expected ${testCase.severity}, got ${result.severity}`);
  if (testCase.needsReview !== undefined && result.needsReview !== testCase.needsReview) problems.push(`needsReview: expected ${testCase.needsReview}, got ${result.needsReview}`);
  if (testCase.language && result.detectedLanguage !== testCase.language) problems.push(`language: expected ${testCase.language}, got ${result.detectedLanguage}`);
  if (!result.severityReason.endsWith(".")) problems.push("severityReason must be a one-line sentence ending with a full stop");

  if (problems.length === 0) {
    passed += 1;
    console.log(`  PASS  ${testCase.name}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${testCase.name}`);
    console.error(`        ${problems.join("; ")}`);
    console.error(`        details: ${JSON.stringify(result)}`);
  }
}

console.log(`\n${passed}/${cases.length} triage checks passed.`);
if (failures > 0) {
  throw new Error(`${failures} triage check(s) failed.`);
}
