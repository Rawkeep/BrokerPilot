export const BROKER_TYPES = {
  immobilien: {
    label: 'Immobilien',
    defaultPage: '/pipeline',
    navOrder: ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'],
    accentColor: 'immobilien',
  },
  krypto: {
    label: 'Krypto',
    defaultPage: '/markt',
    navOrder: ['markt', 'dashboard', 'pipeline', 'ai-agents', 'einstellungen'],
    accentColor: 'krypto',
  },
  finanz: {
    label: 'Finanz & Banking',
    defaultPage: '/dashboard',
    navOrder: ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'],
    accentColor: 'finanz',
  },
  versicherung: {
    label: 'Versicherung',
    defaultPage: '/dashboard',
    navOrder: ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'],
    accentColor: 'versicherung',
  },
  investment: {
    label: 'Investment-Banking',
    defaultPage: '/dashboard',
    navOrder: ['dashboard', 'pipeline', 'markt', 'ai-agents', 'einstellungen'],
    accentColor: 'investment',
  },
};
