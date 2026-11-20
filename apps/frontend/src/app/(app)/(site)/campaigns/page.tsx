export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { CampaignsComponent } from '@gitroom/frontend/components/campaigns/campaigns.component';

export const metadata: Metadata = {
  title: 'Chiến Dịch Nuôi Kênh AI & Auto-Post Studio | Claro Social',
  description: 'Tự động hóa tiếp thị mạng xã hội đa kênh với sức mạnh AI',
};

export default function CampaignsPage() {
  return <CampaignsComponent />;
}
