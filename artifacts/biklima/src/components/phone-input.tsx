import { useMemo } from "react";
import { Input } from "@/components/ui/input";

type Country = { code: string; dial: string; name: string; nameAr: string; flag: string };

export const COUNTRIES: Country[] = [
  { code: "JO", dial: "+962", name: "Jordan",        nameAr: "الأردن",        flag: "🇯🇴" },
  { code: "SA", dial: "+966", name: "Saudi Arabia",  nameAr: "السعودية",      flag: "🇸🇦" },
  { code: "AE", dial: "+971", name: "UAE",           nameAr: "الإمارات",      flag: "🇦🇪" },
  { code: "KW", dial: "+965", name: "Kuwait",        nameAr: "الكويت",        flag: "🇰🇼" },
  { code: "QA", dial: "+974", name: "Qatar",         nameAr: "قطر",           flag: "🇶🇦" },
  { code: "BH", dial: "+973", name: "Bahrain",       nameAr: "البحرين",       flag: "🇧🇭" },
  { code: "OM", dial: "+968", name: "Oman",          nameAr: "عُمان",          flag: "🇴🇲" },
  { code: "EG", dial: "+20",  name: "Egypt",         nameAr: "مصر",           flag: "🇪🇬" },
  { code: "PS", dial: "+970", name: "Palestine",     nameAr: "فلسطين",        flag: "🇵🇸" },
  { code: "IQ", dial: "+964", name: "Iraq",          nameAr: "العراق",         flag: "🇮🇶" },
  { code: "LB", dial: "+961", name: "Lebanon",       nameAr: "لبنان",         flag: "🇱🇧" },
  { code: "SY", dial: "+963", name: "Syria",         nameAr: "سوريا",         flag: "🇸🇾" },
  { code: "YE", dial: "+967", name: "Yemen",         nameAr: "اليمن",         flag: "🇾🇪" },
  { code: "SD", dial: "+249", name: "Sudan",         nameAr: "السودان",       flag: "🇸🇩" },
  { code: "LY", dial: "+218", name: "Libya",         nameAr: "ليبيا",         flag: "🇱🇾" },
  { code: "TN", dial: "+216", name: "Tunisia",       nameAr: "تونس",          flag: "🇹🇳" },
  { code: "DZ", dial: "+213", name: "Algeria",       nameAr: "الجزائر",       flag: "🇩🇿" },
  { code: "MA", dial: "+212", name: "Morocco",       nameAr: "المغرب",        flag: "🇲🇦" },
  { code: "TR", dial: "+90",  name: "Turkey",        nameAr: "تركيا",         flag: "🇹🇷" },
  { code: "GB", dial: "+44",  name: "United Kingdom", nameAr: "المملكة المتحدة", flag: "🇬🇧" },
  { code: "US", dial: "+1",   name: "United States", nameAr: "الولايات المتحدة", flag: "🇺🇸" },
  { code: "CA", dial: "+1",   name: "Canada",        nameAr: "كندا",          flag: "🇨🇦" },
  { code: "DE", dial: "+49",  name: "Germany",       nameAr: "ألمانيا",       flag: "🇩🇪" },
  { code: "FR", dial: "+33",  name: "France",        nameAr: "فرنسا",         flag: "🇫🇷" },
];

const DIALS = [...new Set(COUNTRIES.map((c) => c.dial))].sort((a, b) => b.length - a.length);

export function parsePhone(value: string): { dial: string; national: string } {
  const v = (value || "").replace(/\s+/g, "");
  if (v.startsWith("+")) {
    for (const d of DIALS) {
      if (v.startsWith(d)) return { dial: d, national: v.slice(d.length) };
    }
  }
  return { dial: "+962", national: v.replace(/[^0-9]/g, "") };
}

export type PhoneInputProps = {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  disabled?: boolean;
  lang?: "ar" | "en";
  className?: string;
  testId?: string;
  placeholder?: string;
  ariaLabel?: string;
};

export function PhoneInput({
  id,
  value,
  onChange,
  required,
  disabled,
  lang = "ar",
  className = "",
  testId,
  placeholder,
  ariaLabel,
}: PhoneInputProps) {
  const { dial, national } = useMemo(() => parsePhone(value), [value]);

  const sortedCountries = useMemo(() => {
    return [...COUNTRIES].sort((a, b) => {
      const an = lang === "ar" ? a.nameAr : a.name;
      const bn = lang === "ar" ? b.nameAr : b.name;
      return an.localeCompare(bn, lang);
    });
  }, [lang]);

  const setDial = (d: string) => onChange(`${d}${national}`);
  const setNational = (n: string) => {
    const clean = n.replace(/[^0-9]/g, "").slice(0, 15);
    onChange(`${dial}${clean}`);
  };

  return (
    <div dir="ltr" className={`flex items-stretch gap-1.5 ${className}`}>
      <select
        value={dial}
        onChange={(e) => setDial(e.target.value)}
        disabled={disabled}
        aria-label={lang === "ar" ? "مفتاح الدولة" : "Country code"}
        data-testid={testId ? `${testId}-dial` : undefined}
        className="rounded-xl border border-input bg-background px-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer min-w-[5.5rem]"
      >
        {sortedCountries.map((c) => (
          <option key={c.code} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        dir="ltr"
        required={required}
        disabled={disabled}
        value={national}
        onChange={(e) => setNational(e.target.value)}
        placeholder={placeholder ?? "7X XXX XXXX"}
        aria-label={ariaLabel ?? (lang === "ar" ? "رقم الهاتف" : "Phone number")}
        aria-required={required ? "true" : undefined}
        data-testid={testId}
        className="flex-1 rounded-xl"
        pattern="[0-9]*"
      />
    </div>
  );
}
