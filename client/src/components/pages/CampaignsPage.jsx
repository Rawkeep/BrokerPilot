import { CampaignManager } from '../campaigns/CampaignManager.jsx';

export function CampaignsPage() {
  return (
    <div>
      <h1>Kampagnen</h1>
      <p className="page-subtitle">Automatisierte E-Mail-Sequenzen</p>
      <CampaignManager />
    </div>
  );
}

export default CampaignsPage;
