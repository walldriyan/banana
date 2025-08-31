// src/components/POSUI/CampaignSelector.tsx
import React from 'react';
import type { DiscountSet } from '@/types';

interface CampaignSelectorProps {
  activeCampaign: DiscountSet;
  allCampaigns: DiscountSet[];
  onCampaignChange: (campaign: DiscountSet) => void;
}

const CampaignSelector: React.FC<CampaignSelectorProps> = ({
  activeCampaign,
  allCampaigns,
  onCampaignChange,
}) => {
  return (
    <div className="mb-8">
      <label htmlFor="campaign-selector" className="block text-sm font-medium text-gray-700 mb-2">
        Active Discount Campaign
      </label>
      <div className="relative">
        <select
          id="campaign-selector"
          value={activeCampaign.id}
          onChange={(e) => {
            const selectedCampaign = allCampaigns.find((c) => c.id === e.target.value);
            if (selectedCampaign) {
              onCampaignChange(selectedCampaign);
            }
          }}
          className="w-full appearance-none rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
        >
          {allCampaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
          ▾
        </span>
      </div>
    </div>
  );
};

export default CampaignSelector;
