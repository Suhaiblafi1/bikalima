type EnvironmentIssue = {
  message: string;
  keys: string[];
};

function hasValue(key: string) {
  return Boolean(process.env[key]?.trim());
}

function requireTogether(keys: string[], label: string): EnvironmentIssue | null {
  const configured = keys.filter(hasValue);
  if (configured.length === 0 || configured.length === keys.length) return null;
  return {
    keys: keys.filter((key) => !hasValue(key)),
    message: `${label} is partially configured`,
  };
}

/**
 * Fail early when a production deployment is internally inconsistent.
 * Optional integrations stay optional, but once one credential is present
 * the complete credential set becomes required.
 */
export function validateEnvironment() {
  const issues: EnvironmentIssue[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    for (const key of ["DATABASE_URL", "PUBLIC_APP_URL", "CRON_SECRET"]) {
      if (!hasValue(key)) issues.push({ keys: [key], message: "Required in production" });
    }
  }

  const groupedChecks = [
    requireTogether(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"], "Stripe"),
    requireTogether(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"], "Google OAuth"),
    requireTogether(["SMTP_HOST", "SMTP_USER", "SMTP_PASS"], "SMTP"),
    requireTogether(["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"], "WhatsApp"),
  ];
  for (const issue of groupedChecks) if (issue) issues.push(issue);

  for (const key of ["PUBLIC_APP_URL", "APP_ORIGIN"] as const) {
    const value = process.env[key]?.trim();
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (isProduction && parsed.protocol !== "https:") {
        issues.push({ keys: [key], message: "Production origins must use HTTPS" });
      }
    } catch {
      issues.push({ keys: [key], message: "Must be an absolute URL" });
    }
  }

  if (issues.length > 0) {
    const details = issues
      .map((issue) => `${issue.message}: ${issue.keys.join(", ")}`)
      .join("; ");
    throw new Error(`Invalid server environment — ${details}`);
  }
}
