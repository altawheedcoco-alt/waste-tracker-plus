import { memo, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Link2, Building2, ArrowLeftRight, TrendingUp, Users, Unlink } from 'lucide-react';

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

interface OrgInfo {
  id: string;
  name: string;
  organization_type: string;
  partner_code: string | null;
}

interface PartnershipDetail {
  id: string;
  requester: OrgInfo;
  partner: OrgInfo;
  created_at: string;
}

interface OrgNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  partnerCount: number;
}

const PartnershipNetwork = memo(() => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: OrgNode } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partnership-network-detail'],
    queryFn: async () => {
      const [{ data: partnerships }, { data: orgs }] = await Promise.all([
        supabase.from('verified_partnerships')
          .select('id, requester_org_id, partner_org_id, created_at')
          .eq('status', 'active'),
        supabase.from('organizations')
          .select('id, name, organization_type, partner_code, is_active'),
      ]);
      return { partnerships: partnerships || [], orgs: (orgs || []).filter(o => o.is_active) };
    },
  });

  const orgMap = useMemo(() => {
    if (!data) return new Map<string, OrgInfo>();
    return new Map(data.orgs.map(o => [o.id, o as OrgInfo]));
  }, [data]);

  // Build detailed partnerships list
  const partnershipDetails = useMemo((): PartnershipDetail[] => {
    if (!data) return [];
    return data.partnerships
      .map(p => {
        const req = orgMap.get(p.requester_org_id);
        const part = orgMap.get(p.partner_org_id);
        if (!req || !part) return null;
        return { id: p.id, requester: req, partner: part, created_at: p.created_at };
      })
      .filter(Boolean) as PartnershipDetail[];
  }, [data, orgMap]);

  // Per-org analysis
  const orgAnalysis = useMemo(() => {
    const analysis: Record<string, {
      org: OrgInfo;
      partners: OrgInfo[];
      byType: Record<string, number>;
      totalPartners: number;
    }> = {};

    partnershipDetails.forEach(p => {
      // Add partner to requester
      if (!analysis[p.requester.id]) {
        analysis[p.requester.id] = { org: p.requester, partners: [], byType: {}, totalPartners: 0 };
      }
      analysis[p.requester.id].partners.push(p.partner);
      analysis[p.requester.id].byType[p.partner.organization_type] = (analysis[p.requester.id].byType[p.partner.organization_type] || 0) + 1;
      analysis[p.requester.id].totalPartners++;

      // Add requester to partner
      if (!analysis[p.partner.id]) {
        analysis[p.partner.id] = { org: p.partner, partners: [], byType: {}, totalPartners: 0 };
      }
      analysis[p.partner.id].partners.push(p.requester);
      analysis[p.partner.id].byType[p.requester.organization_type] = (analysis[p.partner.id].byType[p.requester.organization_type] || 0) + 1;
      analysis[p.partner.id].totalPartners++;
    });

    return Object.values(analysis).sort((a, b) => b.totalPartners - a.totalPartners);
  }, [partnershipDetails]);

  // Isolated orgs (no partnerships)
  const isolatedOrgs = useMemo(() => {
    if (!data) return [];
    const connectedIds = new Set(orgAnalysis.map(a => a.org.id));
    return data.orgs.filter(o => !connectedIds.has(o.id));
  }, [data, orgAnalysis]);

  // Network nodes/edges
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    const { partnerships } = data;

    const connectedIds = new Set<string>();
    partnerships.forEach(p => {
      connectedIds.add(p.requester_org_id);
      connectedIds.add(p.partner_org_id);
    });

    const partnerCounts: Record<string, number> = {};
    partnerships.forEach(p => {
      partnerCounts[p.requester_org_id] = (partnerCounts[p.requester_org_id] || 0) + 1;
      partnerCounts[p.partner_org_id] = (partnerCounts[p.partner_org_id] || 0) + 1;
    });

    const connectedOrgs = Array.from(connectedIds)
      .map(id => orgMap.get(id))
      .filter(Boolean) as OrgInfo[];

    const cx = 400, cy = 300;
    const radius = Math.min(250, 80 + connectedOrgs.length * 8);

    const nodeList: OrgNode[] = connectedOrgs.map((org, i) => {
      const angle = (2 * Math.PI * i) / connectedOrgs.length - Math.PI / 2;
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

    return {
      nodes: nodeList,
      edges: partnerships.map(p => ({ from: p.requester_org_id, to: p.partner_org_id })),
    };
  }, [data, orgMap]);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const activeHighlight = hoveredNode || selectedOrg;

  const connectedToActive = useMemo(() => {
    if (!activeHighlight) return new Set<string>();
    const set = new Set<string>();
    edges.forEach(e => {
      if (e.from === activeHighlight) set.add(e.to);
      if (e.to === activeHighlight) set.add(e.from);
    });
    return set;
  }, [activeHighlight, edges]);

  // Filtered analysis for search
  const filteredAnalysis = useMemo(() => {
    if (!searchTerm) return selectedOrg ? orgAnalysis.filter(a => a.org.id === selectedOrg) : orgAnalysis;
    const term = searchTerm.toLowerCase();
    return orgAnalysis.filter(a =>
      a.org.name.toLowerCase().includes(term) ||
      a.partners.some(p => p.name.toLowerCase().includes(term))
    );
  }, [orgAnalysis, searchTerm, selectedOrg]);

  // Type distribution stats
  const typeDistribution = useMemo(() => {
    const dist: Record<string, { count: number; partnerships: number }> = {};
    orgAnalysis.forEach(a => {
      const t = a.org.organization_type;
      if (!dist[t]) dist[t] = { count: 0, partnerships: 0 };
      dist[t].count++;
      dist[t].partnerships += a.totalPartners;
    });
    return dist;
  }, [orgAnalysis]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const viewBoxW = 800, viewBoxH = 600;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Link2 className="w-5 h-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-black">{partnershipDetails.length}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'شراكة مؤكدة' : 'Verified Partnerships'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Building2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-black">{orgAnalysis.length}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'جهة مرتبطة' : 'Connected Entities'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <Unlink className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-black">{isolatedOrgs.length}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'جهة معزولة' : 'Isolated Entities'}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-2xl font-black">
              {orgAnalysis.length > 0 ? (partnershipDetails.length / orgAnalysis.length).toFixed(1) : 0}
            </p>
            <p className="text-[10px] text-muted-foreground">{isAr ? 'متوسط الشراكات' : 'Avg Partnerships'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Type Distribution */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            {isAr ? 'توزيع الشراكات حسب نوع الجهة' : 'Partnerships by Entity Type'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-3">
            {Object.entries(typeDistribution).map(([type, info]) => (
              <div key={type} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/30">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[type] || '#888' }} />
                <div className="text-xs">
                  <span className="font-bold">{isAr ? TYPE_LABELS_AR[type] || type : type}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span>{info.count} {isAr ? 'جهة' : 'entities'}</span>
                  <span className="text-muted-foreground mx-1">·</span>
                  <span className="text-primary font-semibold">{info.partnerships} {isAr ? 'رابط' : 'links'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Legend & Viz */}
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
            {edges.map((edge, i) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;
              const isHighlighted = activeHighlight && (edge.from === activeHighlight || edge.to === activeHighlight);
              const isDimmed = activeHighlight && !isHighlighted;
              return (
                <line
                  key={i}
                  x1={fromNode.x} y1={fromNode.y}
                  x2={toNode.x} y2={toNode.y}
                  stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth={isHighlighted ? 2.5 : 0.8}
                  opacity={isDimmed ? 0.06 : isHighlighted ? 0.9 : 0.2}
                  strokeDasharray={isHighlighted ? undefined : '4 2'}
                />
              );
            })}
            {nodes.map(node => {
              const color = TYPE_COLORS[node.type] || '#888';
              const r = Math.max(8, 5 + node.partnerCount * 2);
              const isActive = activeHighlight === node.id;
              const isConnected = connectedToActive.has(node.id);
              const isDimmed = activeHighlight && !isActive && !isConnected;
              return (
                <g
                  key={node.id}
                  onMouseEnter={(e) => {
                    setHoveredNode(node.id);
                    const svg = svgRef.current;
                    if (svg) {
                      const rect = svg.getBoundingClientRect();
                      setTooltip({
                        x: node.x * (rect.width / viewBoxW) + rect.left,
                        y: node.y * (rect.height / viewBoxH) + rect.top - 10,
                        node,
                      });
                    }
                  }}
                  onMouseLeave={() => { setHoveredNode(null); setTooltip(null); }}
                  onClick={() => setSelectedOrg(prev => prev === node.id ? null : node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {isActive && <circle cx={node.x} cy={node.y} r={r + 6} fill={color} opacity={0.15} />}
                  <circle
                    cx={node.x} cy={node.y} r={r}
                    fill={color}
                    opacity={isDimmed ? 0.15 : 0.85}
                    stroke={isActive ? 'hsl(var(--foreground))' : selectedOrg === node.id ? 'hsl(var(--primary))' : 'none'}
                    strokeWidth={isActive || selectedOrg === node.id ? 2 : 0}
                  />
                  {(r > 10 || isActive || isConnected) && !isDimmed && (
                    <text
                      x={node.x} y={node.y + r + 14}
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

      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg shadow-lg border border-border bg-popover text-popover-foreground text-xs pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-bold">{tooltip.node.name}</p>
          <p className="text-muted-foreground">
            {isAr ? TYPE_LABELS_AR[tooltip.node.type] || tooltip.node.type : tooltip.node.type}
            {' · '}{tooltip.node.partnerCount} {isAr ? 'شريك' : 'partners'}
          </p>
          <p className="text-[10px] text-primary mt-0.5">{isAr ? 'اضغط لعرض التفاصيل' : 'Click for details'}</p>
        </div>
      )}

      {/* Detailed Analysis */}
      <Separator />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {isAr ? 'تحليل الشراكات التفصيلي' : 'Detailed Partnership Analysis'}
            {selectedOrg && (
              <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setSelectedOrg(null)}>
                {isAr ? '✕ إلغاء التصفية' : '✕ Clear filter'}
              </Badge>
            )}
          </h3>
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? 'بحث بالاسم...' : 'Search by name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10 h-9 text-sm"
            />
          </div>
        </div>

        {filteredAnalysis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {isAr ? 'لا توجد نتائج مطابقة' : 'No matching results'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnalysis.map(item => {
              const typeColor = TYPE_COLORS[item.org.organization_type] || '#888';
              return (
                <Card key={item.org.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    {/* Org header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: typeColor }} />
                        <h4 className="font-bold text-foreground">{item.org.name}</h4>
                        <Badge variant="outline" className="text-[10px] border-0" style={{ backgroundColor: typeColor + '15', color: typeColor }}>
                          {isAr ? TYPE_LABELS_AR[item.org.organization_type] || item.org.organization_type : item.org.organization_type}
                        </Badge>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-0 text-xs">
                        {item.totalPartners} {isAr ? 'شريك' : 'partners'}
                      </Badge>
                    </div>

                    {/* Type breakdown */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.byType).map(([type, count]) => (
                        <span key={type} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] || '#888' }} />
                          {count} {isAr ? TYPE_LABELS_AR[type] || type : type}
                        </span>
                      ))}
                    </div>

                    {/* Partners list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {item.partners.map((partner, idx) => (
                        <div
                          key={`${partner.id}-${idx}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrg(prev => prev === partner.id ? null : partner.id)}
                        >
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[partner.organization_type] || '#888' }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{partner.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {isAr ? TYPE_LABELS_AR[partner.organization_type] || partner.organization_type : partner.organization_type}
                              {partner.partner_code && ` · ${partner.partner_code}`}
                            </p>
                          </div>
                          <ArrowLeftRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Isolated entities */}
      {isolatedOrgs.length > 0 && !selectedOrg && (
        <>
          <Separator />
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                <Unlink className="w-4 h-4" />
                {isAr ? `جهات معزولة بدون شراكات (${isolatedOrgs.length})` : `Isolated Entities - No Partnerships (${isolatedOrgs.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {isolatedOrgs.slice(0, 30).map(org => (
                  <Badge key={org.id} variant="outline" className="text-[11px] gap-1.5 border-destructive/20 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[org.organization_type] || '#888' }} />
                    {org.name}
                  </Badge>
                ))}
                {isolatedOrgs.length > 30 && (
                  <Badge variant="outline" className="text-[11px] text-muted-foreground">
                    +{isolatedOrgs.length - 30} {isAr ? 'أخرى' : 'more'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {isAr
          ? `${orgAnalysis.length} جهة مرتبطة · ${partnershipDetails.length} شراكة مؤكدة · ${isolatedOrgs.length} جهة معزولة`
          : `${orgAnalysis.length} connected · ${partnershipDetails.length} partnerships · ${isolatedOrgs.length} isolated`}
      </p>
    </div>
  );
});

PartnershipNetwork.displayName = 'PartnershipNetwork';
export default PartnershipNetwork;
