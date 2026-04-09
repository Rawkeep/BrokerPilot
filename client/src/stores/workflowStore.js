import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_WORKFLOWS = [
  {
    id: '1',
    name: 'Neuer Lead Onboarding',
    description: 'Automatisches Onboarding bei Lead-Erstellung',
    trigger: 'lead_created',
    enabled: true,
    createdAt: new Date().toISOString(),
    lastRun: null,
    runCount: 0,
    steps: [
      { id: 's1', type: 'send_email', templateId: 'welcome', delay: 0 },
      { id: 's2', type: 'add_tag', tag: 'onboarding', delay: 0 },
      { id: 's3', type: 'create_reminder', reminderText: 'Follow-up Anruf', delay: 24 },
      { id: 's4', type: 'send_email', templateId: 'followup', delay: 72 },
    ],
  },
  {
    id: '2',
    name: 'Hot Lead Express',
    description: 'Sofortige Aktion bei Hot-Lead-Score',
    trigger: 'score_hot',
    enabled: true,
    createdAt: new Date().toISOString(),
    lastRun: null,
    runCount: 0,
    steps: [
      { id: 's1', type: 'assign_member', memberId: 'best-closer', delay: 0 },
      { id: 's2', type: 'create_reminder', reminderText: 'Hot Lead sofort kontaktieren!', delay: 0 },
      { id: 's3', type: 'run_pipeline', delay: 1 },
    ],
  },
  {
    id: '3',
    name: 'Deal Abschluss',
    description: 'Automatisierung nach Abschluss',
    trigger: 'deal_closed',
    enabled: false,
    createdAt: new Date().toISOString(),
    lastRun: null,
    runCount: 0,
    steps: [
      { id: 's1', type: 'send_email', templateId: 'closing', delay: 0 },
      { id: 's2', type: 'add_tag', tag: 'abgeschlossen', delay: 0 },
    ],
  },
];

export const useWorkflowStore = create(
  persist(
    (set, get) => ({
      workflows: DEFAULT_WORKFLOWS,

      addWorkflow: (workflow) =>
        set((state) => ({
          workflows: [
            ...state.workflows,
            {
              ...workflow,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              lastRun: null,
              runCount: 0,
            },
          ],
        })),

      updateWorkflow: (id, updates) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      deleteWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
        })),

      toggleWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),

      addStep: (workflowId, step) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === workflowId
              ? { ...w, steps: [...w.steps, { ...step, id: crypto.randomUUID() }] }
              : w
          ),
        })),

      removeStep: (workflowId, stepId) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === workflowId
              ? { ...w, steps: w.steps.filter((s) => s.id !== stepId) }
              : w
          ),
        })),

      reorderSteps: (workflowId, stepIds) =>
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            const stepMap = Object.fromEntries(w.steps.map((s) => [s.id, s]));
            return { ...w, steps: stepIds.map((id) => stepMap[id]).filter(Boolean) };
          }),
        })),

      recordRun: (workflowId) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === workflowId
              ? { ...w, lastRun: new Date().toISOString(), runCount: w.runCount + 1 }
              : w
          ),
        })),
    }),
    {
      name: 'brokerpilot-workflows',
    }
  )
);
