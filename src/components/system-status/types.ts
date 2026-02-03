// Feature status types
export type FeatureStatus = 'completed' | 'in_progress' | 'planned' | 'has_issues';

export interface Feature {
  name: string;
  description: string;
  status: FeatureStatus;
  progress: number;
  issues?: string[];
  suggestions?: string[];
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export interface SystemModule {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  features: Feature[];
  overallProgress: number;
  strengths: string[];
  weaknesses: string[];
  futureVision: string;
}

export interface SystemStats {
  totalShipments: number;
  totalOrganizations: number;
  totalDrivers: number;
  totalContracts: number;
  pendingApprovals: number;
  activeTickets: number;
  resolvedTickets: number;
  systemUptime: number;
}
