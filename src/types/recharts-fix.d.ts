// Fix recharts JSX component type compatibility with @types/react
// This resolves the "cannot be used as a JSX component" errors
import type { ComponentType } from 'react';

declare module 'recharts' {
  // Chart components
  export const AreaChart: ComponentType<any>;
  export const BarChart: ComponentType<any>;
  export const LineChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const RadarChart: ComponentType<any>;
  export const ComposedChart: ComponentType<any>;
  export const ResponsiveContainer: ComponentType<any>;

  // Axis components
  export const XAxis: ComponentType<any>;
  export const YAxis: ComponentType<any>;
  export const CartesianGrid: ComponentType<any>;
  export const PolarAngleAxis: ComponentType<any>;
  export const PolarRadiusAxis: ComponentType<any>;
  export const PolarGrid: ComponentType<any>;

  // Data components
  export const Area: ComponentType<any>;
  export const Bar: ComponentType<any>;
  export const Line: ComponentType<any>;
  export const Pie: ComponentType<any>;
  export const Radar: ComponentType<any>;
  export const Cell: ComponentType<any>;
  export const Scatter: ComponentType<any>;

  // UI components
  export const Tooltip: ComponentType<any>;
  export const Legend: ComponentType<any>;
  export const ReferenceLine: ComponentType<any>;
  export const ReferenceArea: ComponentType<any>;
  export const Brush: ComponentType<any>;
  export const Label: ComponentType<any>;
  export const LabelList: ComponentType<any>;
}
