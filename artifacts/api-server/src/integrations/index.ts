import type { IntegrationService, IntegrationStatus } from "./types.js";
import { odooService } from "./odooService.js";
import { openaiService } from "./openaiService.js";
import { geminiService } from "./geminiService.js";
import { whatsappService } from "./whatsappService.js";
import { paymentService } from "./paymentService.js";
import { storageService } from "./storageService.js";

export const integrations = {
  odoo: odooService,
  openai: openaiService,
  gemini: geminiService,
  whatsapp: whatsappService,
  payment: paymentService,
  storage: storageService,
} as const;

const REGISTRY: IntegrationService[] = [
  odooService,
  openaiService,
  geminiService,
  whatsappService,
  paymentService,
  storageService,
];

export function getAllIntegrationStatuses(): IntegrationStatus[] {
  return REGISTRY.map((s) => s.getStatus());
}

export {
  odooService,
  openaiService,
  geminiService,
  whatsappService,
  paymentService,
  storageService,
};
export type { IntegrationProvider, IntegrationStatus, IntegrationService } from "./types.js";
