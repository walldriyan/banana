// src/lib/my-campaigns.ts
import type { DiscountSet } from '@/types';
import { buyMoreSaveMore } from './buymore-campain';
import { clearanceSale, vipExclusive, megaDealFest as megaDealFestDefinition } from './campaign-definitions';
import { defaultDiscounts, noDiscounts, productDefaults } from './default-campaign';


// This is now the main export that combines all campaigns for easy access.
export const allCampaigns: DiscountSet[] = [
  productDefaults, // Use product's own default discount/tax
  noDiscounts, // Add the new "No Discount" option first
  defaultDiscounts, // The default campaign
  megaDealFestDefinition,
  buyMoreSaveMore,
  clearanceSale,
  vipExclusive,
];

// Maintain the individual export for backward compatibility if needed elsewhere.
export const megaDealFest = megaDealFestDefinition;


/**
 * Finds a campaign by its ID from the master list of all campaigns.
 * This is crucial for the refund process to dynamically find the correct set of rules.
 * @param campaignId The ID of the campaign to find.
 * @returns The DiscountSet object or undefined if not found.
 */
export function findCampaignById(campaignId: string): DiscountSet | undefined {
  return allCampaigns.find(c => c.id === campaignId);
}
