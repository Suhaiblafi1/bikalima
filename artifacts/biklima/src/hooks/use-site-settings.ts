import { useQuery } from "@tanstack/react-query";

export type PublicSiteSettings = {
  siteNameAr: string | null;
  siteNameEn: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  twitterUrl: string | null;
  privacyPolicyAr: string | null;
  privacyPolicyEn: string | null;
  termsAr: string | null;
  termsEn: string | null;
};

function getApiBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "").replace(/\/[^/]+$/, "") + "/api";
}

/** The currency a card is actually billed in — see the checkout disclosure. */
export type PaymentCurrency = { code: string; symbol: string; decimals: number };

export function useSiteSettings() {
  return useQuery<{ settings: PublicSiteSettings | null; paymentCurrency?: PaymentCurrency }>({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/site-settings`, { credentials: "same-origin" });
      if (!res.ok) throw new Error(`Failed to load site settings (${res.status})`);
      return res.json();
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
