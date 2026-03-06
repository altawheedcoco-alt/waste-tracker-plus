import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Landmark, Truck, Factory, Building2, Scale, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useRegulatorJurisdictions, useAllRegulatorLevels, useRegulatorConfig } from '@/hooks/useRegulatorData';
import { Skeleton } from '@/components/ui/skeleton';

const ORG_TYPE_MAP: Record<string, string> = {
  generator: 'مولد مخلفات',
  transporter: 'ناقل',
  recycler: 'مدوّر / مصنع',
  disposal: 'تخلص نهائي',
  consultant: 'استشاري بيئي',
  consulting_office: 'مكتب استشاري',
  iso_body: 'جهة أيزو',
};

const LEVEL_META: Record<string, { icon: any; color: string; bg: string }> = {
  wmra: { icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
  eeaa: { icon: Landmark, color: 'text-emerald-700', bg: 'bg-emerald-500/10' },
  ltra: { icon: Truck, color: 'text-blue-700', bg: 'bg-blue-500/10' },
  ida: { icon: Factory, color: 'text-amber-700', bg: 'bg-amber-500/10' },
  ministry: { icon: Landmark, color: 'text-purple-700', bg: 'bg-purple-500/10' },
  governorate: { icon: Building2, color: 'text-teal-700', bg: 'bg-teal-500/10' },
};

const JurisdictionPanel = () => {
  const { data: config, isLoading: configLoading } = useRegulatorConfig();
  const { data: jurisdictions = [], isLoading: jurLoading } = useRegulatorJurisdictions();
  const { data: allLevels = [], isLoading: levelsLoading } = useAllRegulatorLevels();

  const isLoading = configLoading || jurLoading || levelsLoading;
  const levelCode = config?.regulator_level_code || '';

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Authority Info */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="w-5 h-5 text-primary" />
            الاختصاص الرقابي للجهة الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            {(() => {
              const meta = LEVEL_META[levelCode] || LEVEL_META.wmra;
              const Icon = meta.icon;
              return (
                <div className={`p-3 rounded-xl ${meta.bg}`}>
                  <Icon className={`w-8 h-8 ${meta.color}`} />
                </div>
              );
            })()}
            <div>
              <h3 className="text-xl font-bold">{(config as any)?.regulator_levels?.level_name_ar || levelCode}</h3>
              <p className="text-sm text-muted-foreground">{(config as any)?.regulator_levels?.level_name_en}</p>
              {(config as any)?.regulator_levels?.description_ar && (
                <p className="text-xs text-muted-foreground mt-1">{(config as any)?.regulator_levels?.description_ar}</p>
              )}
            </div>
          </div>

          {/* Jurisdiction Details */}
          <div className="grid gap-3">
            {(jurisdictions as any[]).map((j: any) => (
              <div key={j.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                <div className="shrink-0 mt-0.5">
                  <Badge variant={j.is_primary_authority ? 'default' : 'outline'} className="text-[10px]">
                    {j.is_primary_authority ? '🔑 سلطة أساسية' : 'إشراف مشترك'}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{ORG_TYPE_MAP[j.supervised_org_type] || j.supervised_org_type}</span>
                    <Badge variant="secondary" className="text-[10px]">{j.supervision_scope}</Badge>
                  </div>
                  
                  {/* Capabilities */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { key: 'can_issue_license', label: 'إصدار تراخيص', icon: FileText },
                      { key: 'can_revoke_license', label: 'سحب تراخيص', icon: XCircle },
                      { key: 'can_inspect', label: 'تفتيش', icon: CheckCircle },
                      { key: 'can_penalize', label: 'عقوبات', icon: Scale },
                    ].map(({ key, label, icon: CapIcon }) => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                          j[key] ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground line-through'
                        }`}
                      >
                        <CapIcon className="w-3 h-3" />
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* License Types */}
                  {j.license_types?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {j.license_types.map((lt: string) => (
                        <Badge key={lt} variant="outline" className="text-[9px] font-mono">
                          {lt}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Legal Reference */}
                  {j.legal_reference_ar && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      📜 {j.legal_reference_ar}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Regulatory Bodies Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            الهيكل الرقابي الهرمي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(allLevels as any[]).map((level: any) => {
              const meta = LEVEL_META[level.level_code] || LEVEL_META.wmra;
              const Icon = meta.icon;
              const isCurrent = level.level_code === levelCode;
              return (
                <div
                  key={level.id}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${meta.bg}`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{level.level_name_ar}</h4>
                      <p className="text-[10px] text-muted-foreground">{level.level_name_en}</p>
                    </div>
                    {isCurrent && <Badge className="mr-auto text-[9px]">أنت هنا</Badge>}
                  </div>
                  {level.parent_level_code && (
                    <p className="text-[10px] text-muted-foreground">
                      ↑ تتبع: {(allLevels as any[]).find((l: any) => l.level_code === level.parent_level_code)?.level_name_ar || level.parent_level_code}
                    </p>
                  )}
                  {level.description_ar && (
                    <p className="text-[10px] text-muted-foreground mt-1">{level.description_ar}</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JurisdictionPanel;
