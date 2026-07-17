// Mirrors the destination/program names on the main CompeTenza site
// (competence-site/src/lib/data/destinations.ts) so applicants pick from
// the same options. Kept as a small static list here since this tool is
// intentionally standalone — no shared build pipeline with the main site.
export const destinations = [
  { slug: "albania", name: "Albania", programs: ["Culinary Arts", "Pastry & Baking", "Food & Beverage Management"] },
  { slug: "cyprus", name: "Cyprus", programs: ["Nursing & Health Sciences", "Business Administration", "Hospitality & Tourism", "Foundation / Pathway"] },
  { slug: "malaysia", name: "Malaysia", programs: ["Business & Management", "Information Technology", "Engineering", "Foundation Programs"] },
  { slug: "cambodia", name: "Cambodia", programs: ["Hospitality Management", "Business Administration", "International Relations"] },
  { slug: "thailand", name: "Thailand", programs: ["Hospitality & Tourism Management", "Business Administration", "International Culinary Arts"] },
  { slug: "russia", name: "Russia", programs: ["Medicine (MBBS equivalent)", "Engineering", "Business & Economics"] },
] as const;

export type DestinationSlug = (typeof destinations)[number]["slug"];
