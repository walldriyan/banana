// src/components/POSUI/CampaignSelector.tsx
import React, { useMemo } from 'react';
import type { DiscountSet } from '@/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

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
  const { customCampaigns, builtInCampaigns } = useMemo(() => {
    // A simple way to distinguish DB campaigns is if they have a 'createdAt' field,
    // which our hardcoded TS objects do not have.
    const custom = allCampaigns.filter(c => 'createdAt' in c);
    const builtIn = allCampaigns.filter(c => !('createdAt' in c));
    return { customCampaigns: custom, builtInCampaigns: builtIn };
  }, [allCampaigns]);

  const handleValueChange = (value: string) => {
    const selectedCampaign = allCampaigns.find((c) => c.id === value);
    if (selectedCampaign) {
      onCampaignChange(selectedCampaign);
    }
  };

  return (
    <div>
      <Select value={activeCampaign.id} onValueChange={handleValueChange}>
        <SelectTrigger id="campaign-selector" className="h-12 text-base">
          <SelectValue placeholder="Select Campaign..." />
        </SelectTrigger>
        <SelectContent>
            {customCampaigns.length > 0 && (
                <SelectGroup>
                    <SelectLabel>Custom Campaigns</SelectLabel>
                    {customCampaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            )}
            
            <SelectGroup>
                <SelectLabel>Built-in Campaigns</SelectLabel>
                {builtInCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    </SelectItem>
                ))}
            </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CampaignSelector;
