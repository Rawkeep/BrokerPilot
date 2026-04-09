import { TeamManager } from '../team/TeamManager.jsx';

export function TeamPage() {
  return (
    <div>
      <h1>Team</h1>
      <p className="page-subtitle">Mitglieder, Zuweisung und Leaderboard</p>
      <TeamManager />
    </div>
  );
}

export default TeamPage;
