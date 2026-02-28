import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  generator: '#3b82f6',
  transporter: '#f97316',
  recycler: '#22c55e',
  disposal: '#ef4444',
  consultant: '#a855f7',
  consulting_office: '#8b5cf6',
  iso_body: '#f59e0b',
};

const TYPE_LABELS_AR: Record<string, string> = {
  generator: 'مولد',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص',
  consultant: 'استشاري',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة أيزو',
};

interface OrgNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  partnerCount: number;
}

interface PartnerEdge {
  from: string;
  to: string;
}

const PartnershipNetwork = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: OrgNode } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partnership-network'],
    queryFn: async () => {
      const [{ data: partnerships }, { data: orgs }] = await Promise.all([
        supabase.from('verified_partnerships').select('requester_org_id, partner_org_id').eq('status', 'active'),
        supabase.from('organizations').select('id, name, organization_type').eq('is_active', true),
      ]);
      return { partnerships: partnerships || [], orgs: orgs || [] };
    },
  });

  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    const { partnerships, orgs } = data;

    // Only include orgs that have at least one partnership
    const connectedIds = new Set<string>();
    const edgeList: PartnerEdge[] = [];

    partnerships.forEach(p => {
      connectedIds.add(p.requester_org_id);
      connectedIds.add(p.partner_org_id);
      edgeList.push({ from: p.requester_org_id, to: p.partner_org_id });
    });

    const orgMap = new Map(orgs.map(o => [o.id, o]));
    const partnerCounts: Record<string, number> = {};
    partnerships.forEach(p => {
      partnerCounts[p.requester_org_id] = (partnerCounts[p.requester_org_id] || 0) + 1;
      partnerCounts[p.partner_org_id] = (partnerCounts[p.partner_org_id] || 0) + 1;
    });

    const connectedOrgs = Array.from(connectedIds)
      .map(id => orgMap.get(id))
      .filter(Boolean) as any[];

    // Layout: circular with some randomness for visual appeal
    const cx = 400, cy = 300;
    const radius = Math.min(250, 80 + connectedOrgs.length * 8);

    const nodeList: OrgNode[] = connectedOrgs.map((org, i) => {
      const angle = (2 * Math.PI * i) / connectedOrgs.length - Math.PI / 2;
      // Add slight variation based on partner count
      const r = radius + (partnerCounts[org.id] || 0) * 3;
      return {
        id: org.id,
        name: org.name,
        type: org.organization_type,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        partnerCount: partnerCounts[org.id] || 0,
      };
    });

    return { nodes: nodeList, edges: edgeList };
  }, [data]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const connectedToHovered = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const set = new Set<string>();
    edges.forEach(e => {
      if (e.from === hoveredNode) set.add(e.to);
      if (e.to === hoveredNode) set.add(e.from);
    });
    return set;
  }, [hoveredNode, edges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {isAr ? 'لا توجد شراكات مؤكدة لعرضها' : 'No verified partnerships to display'}
      </div>
    );
  }

  const viewBoxW = 800, viewBoxH = 600;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{isAr ? TYPE_LABELS_AR[type] || type : type}</span>
          </div>
        ))}
      </div>

      <Card className="border-border/50 overflow-hidden relative">
        <CardContent className="p-0">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            className="w-full h-[500px] sm:h-[600px]"
            style={{ background: 'hsl(var(--card))' }}
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted = hoveredNode && (edge.from === hoveredNode || edge.to === hoveredNode);
              const isDimmed = hoveredNode && !isHighlighted;

              return (
                <line
                  key={i}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth={isHighlighted ? 2 : 0.8}
                  opacity={isDimmed ? 0.08 : isHighlighted ? 0.9 : 0.2}
                  strokeDasharray={isHighlighted ? undefined : '4 2'}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const color = TYPE_COLORS[node.type] || '#888';
              const r = Math.max(8, 5 + node.partnerCount * 2);
              const isActive = hoveredNode === node.id;
              const isConnected = connectedToHovered.has(node.id);
              const isDimmed = hoveredNode && !isActive && !isConnected;

              return (
                <g
                  key={node.id}
                  onMouseEnter={(e) => {
                    setHoveredNode(node.id);
                    const svg = svgRef.current;
                    if (svg) {
                      const rect = svg.getBoundingClientRect();
                      const scaleX = rect.width / viewBoxW;
                      const scaleY = rect.height / viewBoxH;
                      setTooltip({ x: node.x * scaleX + rect.left, y: node.y * scaleY + rect.top - 10, node });
                    }
                  }}
                  onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Glow ring on hover */}
                  {isActive && (
                    <circle cx={node.x} cy={node.y} r={r + 6} fill={color} opacity={0.15} />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={color}
                    opacity={isDimmed ? 0.15 : 0.85}
                    stroke={isActive ? 'hsl(var(--foreground))' : 'none'}
                    strokeWidth={isActive ? 2 : 0}
                  />
                  {/* Label (only for larger or active nodes) */}
                  {(r > 10 || isActive || isConnected) && !isDimmed && (
                    <text
                      x={node.x}
                      y={node.y + r + 14}
                      textAnchor="middle"
                      fontSize={isActive ? 11 : 9}
                      fill="hsl(var(--foreground))"
                      opacity={isActive ? 1 : 0.7}
                      fontWeight={isActive ? 700 : 400}
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.name.length > 15 ? node.name.slice(0, 14) + '…' : node.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </CardContent>
      </Card>

      {/* Tooltip (outside SVG for proper styling) */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg shadow-lg border border-border bg-popover text-popover-foreground text-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="font-bold">{tooltip.node.name}</p>
          <p className="text-muted-foreground">
            {isAr ? TYPE_LABELS_AR[tooltip.node.type] || tooltip.node.type : tooltip.node.type}
            {' · '}
            {tooltip.node.partnerCount} {isAr ? 'شريك' : 'partners'}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {isAr
          ? `${nodes.length} جهة مرتبطة · ${edges.length} شراكة مؤكدة`
          : `${nodes.length} connected entities · ${edges.length} verified partnerships`}
      </p>
    </div>
  );
});

PartnershipNetwork.displayName = 'PartnershipNetwork';
export default PartnershipNetwork;
