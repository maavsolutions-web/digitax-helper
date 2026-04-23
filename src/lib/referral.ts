// Build a referral slug from a name + 4 random digits.
// Example: "CA Rohan Mehta" -> "rohan4821"
export const buildReferralSlug = (fullName: string): string => {
  const first = (fullName || "ca")
    .replace(/^ca\s+/i, "")
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "") || "ca";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${first}${digits}`;
};

export const REFERRED_CA_KEY = "maav_referred_by_ca";
