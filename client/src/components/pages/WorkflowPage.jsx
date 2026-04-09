import { WorkflowBuilder } from '../workflows/WorkflowBuilder.jsx';

export function WorkflowPage() {
  return (
    <div>
      <h1>Workflows</h1>
      <p className="page-subtitle">Visuelle Automatisierungen</p>
      <WorkflowBuilder />
    </div>
  );
}

export default WorkflowPage;
