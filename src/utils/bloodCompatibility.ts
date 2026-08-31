// ─────────────────────────────────────────────────────────
// BLOOD COMPATIBILITY UTILITY (Deterministic)
// Compatibility Rules for Red Blood Cell (RBC) donation:
// - O- can donate to all (Universal RBC Donor)
// - O+ can donate to O+, A+, B+, AB+
// - A- can donate to A-, A+, AB-, AB+
// - A+ can donate to A+, AB+
// - B- can donate to B-, B+, AB-, AB+
// - B+ can donate to B+, AB+
// - AB- can donate to AB-, AB+
// - AB+ can donate only to AB+ (Universal RBC Receiver)
// ─────────────────────────────────────────────────────────

export const BLOOD_COMPATIBILITY_TABLE: Record<string, string[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

/**
 * Returns true if a donor with `donorBloodGroup` can donate to a recipient/request needing `recipientBloodGroup`.
 * Deterministic, rule-based check. Never guessed.
 */
export const isBloodCompatible = (donorBloodGroup: string, recipientBloodGroup: string): boolean => {
  if (!donorBloodGroup || !recipientBloodGroup) return false;
  const normalizedDonor = donorBloodGroup.trim().toUpperCase();
  const normalizedRecipient = recipientBloodGroup.trim().toUpperCase();
  const allowed = BLOOD_COMPATIBILITY_TABLE[normalizedDonor];
  return allowed ? allowed.includes(normalizedRecipient) : false;
};

/**
 * Returns list of donor blood groups compatible for a given recipient blood group.
 */
export const getCompatibleDonorBloodGroups = (recipientBloodGroup: string): string[] => {
  if (!recipientBloodGroup) return [];
  const normalizedRecipient = recipientBloodGroup.trim().toUpperCase();
  return Object.keys(BLOOD_COMPATIBILITY_TABLE).filter(donorBg =>
    BLOOD_COMPATIBILITY_TABLE[donorBg].includes(normalizedRecipient)
  );
};
