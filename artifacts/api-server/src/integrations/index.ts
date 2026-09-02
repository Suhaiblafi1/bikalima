import type { IntegrationService, IntegrationStatus } from "./types.js";
import { odooService } from "./odooService.js";
import { whatsappService } from "./whatsappService.js";
import { paymentService } from "./paymentService.js";
import { storageService } from "./storageService.js";
import { videoGenService } from "./videoGenService.js";

export const integrations = {
  odoo: odooService,
  whatsapp: whatsappService,
  payment: paymentService,
  storage: storageService,
  videoGen: videoGenService,
} as const;

const REGISTRY: IntegrationService[] = [
  odooService,
  whatsappService,
  paymentService,
  storageService,
  videoGenService,
];

export function getAllIntegrationStatuses(): IntegrationStatus[] {
  return REGISTRY.map((s) => s.getStatus());
}

export {
  odooService,
  whatsappService,
  paymentService,
  storageService,
  videoGenService,
};
export type { IntegrationProvider, IntegrationStatus, IntegrationService } from "./types.js";
