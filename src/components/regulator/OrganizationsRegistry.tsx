import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, CheckCircle, XCircle, Filter, Shield, Landmark, Truck, Factory } from 'lucide-react';
import { useAllOrganizations, useRegulatorJurisdictions, useRegulatorConfig } from '@/hooks/useRegulatorData';
import { format } from 'date-fns';

const ORG_TYPE_MAP: Record<string, string> = {
  generator: 'مولد مخلفات',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص نهائي',
  consultant: 'استشاري بيئي',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة أيزو',
};

const SCOPE_LABELS: Record<string, { label: string; color: string }> = {
  full: { label: 'رقابة شاملة', color: 'bg-primary/10 text-primary' },
  environmental: { label: 'رقابة بيئية', color: 'bg-emerald-500/10 text-emerald-700' },
  transport: { label: 'رقابة نقل', color: 'bg-blue-500/10 text-blue-700' },
  industrial: { label: 'رقابة صناعية', color: 'bg-amber-500/10 text-amber-700' },
};

const LEVEL_ICONS: Record<string, any> = {
  wmra: Shield,
  eeaa: Landmark,
  ltra: Truck,
  ida: Factory,
  ministry: Landmark,
  governorate: Building2,
};

const OrganizationsRegistry = () => {
  const { data: config } = useRegulatorConfig();
  const { data: jurisdictions = [] } = useRegulatorJurisdictions();
  const supervisedTypes = [...new Set((jurisdictions as any[]).map((j: any) => j.supervised_org_type))];
  const { data: orgs = [], isLoading } = useAllOrganizations(supervisedTypes.length > 0 ? supervisedTypes : undefined);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const levelCode = config?.regulator_level_code || '';
  const LevelIcon = LEVEL_ICONS[levelCode] || Shield;

  // Build jurisdiction map for quick lookup
  const jurisdictionMap = (jurisdictions as any[]).reduce((acc: Record<string, any>, j: any) => {
    acc[j.supervised_org_type] = j;
    return acc;
  }, {});

  const filtered = orgs.filter((org: any) => {
    const matchSearch = !search || org.name?.includes(search) || org.name_en?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || org.organization_type === typeFilter;
    return matchSearch && matchType;
  });

  const typeCounts = orgs.reduce((acc: Record<string, number>, org: any) => {
    acc[org.organization_type] = (acc[org.organization_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Jurisdiction Summary */}
      {jurisdictions.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <LevelIcon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">نطاق الإشراف الرقابي</h3>
              <Badge variant="outline" className="text-[10px]">
                {(config as any)?.regulator_levels?.level_name_ar || levelCode}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {(jurisdictions as any[]).map((j: any) => {
                const scope = SCOPE_LABELS[j.supervision_scope] || SCOPE_LABELS.full;
                return (
                  <div key={j.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${scope.color}`}>
                    {j.is_primary_authority && <Shield className="w-3 h-3" />}
                    {ORG_TYPE_MAP[j.supervised_org_type] || j.supervised_org_type}
                    <span className="opacity-60">— {scope.label}</span>
                  </div>
                );
              })}
            </div>
            {(jurisdictions as any[])[0]?.legal_reference_ar && (
              <p className="text-[10px] text-muted-foreground mt-2">
                📜 السند القانوني: {(jurisdictions as any[]).map((j: any) => j.legal_reference_ar).filter(Boolean).join(' | ')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Organizations Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            سجل المنظمات الخاضعة للرقابة ({orgs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Type summary badges */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(typeCounts).map(([type, count]) => {
              const jur = jurisdictionMap[type];
              return (
                <Badge
                  key={type}
                  variant={typeFilter === type ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
                >
                  {jur?.is_primary_authority && '🔑 '}
                  {ORG_TYPE_MAP[type] || type}: {count as number}
                </Badge>
              );
            })}
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pr-9" placeholder="بحث عن منظمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 ml-1" />
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {supervisedTypes.map((type) => (
                  <SelectItem key={type} value={type}>{ORG_TYPE_MAP[type] || type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organizations list */}
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="p-2">اسم المنظمة</th>
                    <th className="p-2">النوع</th>
                    <th className="p-2">نطاق الرقابة</th>
                    <th className="p-2">المحافظة</th>
                    <th className="p-2">التحقق</th>
                    <th className="p-2">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org: any) => {
                    const jur = jurisdictionMap[org.organization_type];
                    const scope = jur ? (SCOPE_LABELS[jur.supervision_scope] || SCOPE_LABELS.full) : null;
                    return (
                      <tr key={org.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            {org.logo_url ? (
                              <img src={org.logo_url} alt={org.name} className="w-7 h-7 rounded-md object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            {org.name}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-[10px]">
                            {ORG_TYPE_MAP[org.organization_type] || org.organization_type}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {scope ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${scope.color}`}>
                              {jur.is_primary_authority && <Shield className="w-3 h-3" />}
                              {scope.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{org.city || org.region || '-'}</td>
                        <td className="p-2">
                          {org.is_verified ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {format(new Date(org.created_at), 'yyyy/MM/dd')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-6">لا توجد نتائج</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationsRegistry;
