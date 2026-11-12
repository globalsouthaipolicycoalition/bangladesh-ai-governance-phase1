export const BANGLADESH_SECTOR_OPTIONS = [
  { id: "banking", label: "Banking", labelBn: "ব্যাংকিং" },
  { id: "nbfi", label: "NBFI", labelBn: "NBFI" },
  { id: "payments", label: "Payments", labelBn: "পেমেন্ট" },
  { id: "fintech", label: "Fintech", labelBn: "ফিনটেক" },
  { id: "healthcare", label: "Healthcare", labelBn: "স্বাস্থ্যসেবা" },
  { id: "pharmaceuticals", label: "Pharmaceuticals", labelBn: "ওষুধশিল্প" },
  { id: "public_health", label: "Public health", labelBn: "জনস্বাস্থ্য" },
  { id: "research", label: "Research", labelBn: "গবেষণা" },
  { id: "schools", label: "Schools", labelBn: "স্কুল" },
  { id: "higher_education", label: "Higher education", labelBn: "উচ্চশিক্ষা" },
  { id: "training", label: "Training", labelBn: "প্রশিক্ষণ" },
  { id: "edtech", label: "EdTech", labelBn: "এডটেক" },
  { id: "telecom", label: "Telecommunications", labelBn: "টেলিযোগাযোগ" },
  { id: "telecom_supplier", label: "Telecom supplier", labelBn: "টেলিকম সরবরাহকারী" },
  { id: "technology", label: "Technology and software", labelBn: "প্রযুক্তি ও সফটওয়্যার" },
  { id: "government", label: "Government", labelBn: "সরকার" },
  { id: "local_government", label: "Local government", labelBn: "স্থানীয় সরকার" },
  { id: "public_body", label: "Public body", labelBn: "সরকারি সংস্থা" },
  { id: "public_services", label: "Public services", labelBn: "জনসেবা" },
  { id: "sme", label: "SME", labelBn: "SME" },
  { id: "startup", label: "Startup", labelBn: "স্টার্টআপ" },
  { id: "agriculture", label: "Agriculture", labelBn: "কৃষি" },
  { id: "energy_utilities", label: "Energy and utilities", labelBn: "জ্বালানি ও ইউটিলিটি" },
  { id: "transportation", label: "Transportation", labelBn: "পরিবহন" },
  { id: "manufacturing", label: "Manufacturing", labelBn: "উৎপাদন" },
  { id: "retail_ecommerce", label: "Retail and e-commerce", labelBn: "খুচরা ও ই-কমার্স" },
  { id: "media_journalism", label: "Media and journalism", labelBn: "গণমাধ্যম ও সাংবাদিকতা" },
  { id: "insurance", label: "Insurance", labelBn: "বীমা" },
  { id: "legal_justice", label: "Legal and justice", labelBn: "আইন ও বিচার" },
  { id: "other", label: "Other sector", labelBn: "অন্যান্য খাত" },
] as const;

export type BangladeshSectorOption = (typeof BANGLADESH_SECTOR_OPTIONS)[number]["id"];
export type BangladeshSector = "all" | BangladeshSectorOption;

function normalizeLabel(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeBangladeshSector(value: string | null | undefined): BangladeshSectorOption | undefined {
  if (!value?.trim()) return undefined;
  const normalized = normalizeLabel(value);
  for (const option of BANGLADESH_SECTOR_OPTIONS) {
    if (normalized === normalizeLabel(option.id) || normalized === normalizeLabel(option.label) || normalized === normalizeLabel(option.labelBn)) {
      return option.id;
    }
  }
  return undefined;
}

export function getBangladeshSectorLabel(value: string | null | undefined, isBangla = false): string | undefined {
  const sector = normalizeBangladeshSector(value);
  if (!sector) return value?.trim() || undefined;
  const option = BANGLADESH_SECTOR_OPTIONS.find(item => item.id === sector);
  return option ? (isBangla ? option.labelBn : option.label) : undefined;
}
