import {
  type IntegrationService,
  type IntegrationStatus,
  type NotConfiguredResult,
  checkEnvVars,
  notConfigured,
} from "./types.js";

const REQUIRED_ENV = ["ODOO_BASE_URL", "ODOO_API_KEY"];

type SyncEntityType = "enrollment_request" | "workbook_order" | "speech_evaluation";

type SyncResult =
  | { ok: true; externalId: string }
  | NotConfiguredResult
  | { ok: false; reason: "error"; message: string };

export const odooService: IntegrationService & {
  syncLead(payload: {
    entityType: SyncEntityType;
    entityId: string;
    name: string;
    email: string;
    phone?: string;
    notes?: string;
    extra?: Record<string, unknown>;
  }): Promise<SyncResult>;
} = {
  provider: "odoo",

  isEnabled() {
    return checkEnvVars(REQUIRED_ENV).enabled;
  },

  getStatus(): IntegrationStatus {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    return {
      provider: "odoo",
      name: "Odoo CRM",
      description: "Sync enrollment requests, workbook orders and speech evaluations as CRM leads.",
      enabled,
      state: enabled ? "active" : "inactive",
      requiredEnvVars: REQUIRED_ENV,
      missingEnvVars: missing,
    };
  },

  async syncLead(_payload) {
    const { enabled, missing } = checkEnvVars(REQUIRED_ENV);
    if (!enabled) return notConfigured("odoo", missing);
    // TODO: implement Odoo XML-RPC / REST call against ODOO_BASE_URL with ODOO_API_KEY.
    return { ok: false, reason: "error", message: "odoo_sync_not_implemented" };
  },
};
