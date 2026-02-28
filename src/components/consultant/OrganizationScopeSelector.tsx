import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, Search, ChevronDown, ChevronUp,
  Globe, CheckCircle2, Eye, Users,
} from 'lucide-react';

const orgTypeLabels: Record<string, string> = {
  generator: 'مولد مخلفات',
  transporter: 'ناقل',
  recycler: 'مدوّر',
  disposal: 'تخلص نهائي',
};

const orgTypeIcons: Record<string, string> = {
  generator: '🏭',
  transporter: '🚛',
  recycler: '♻️',
  disposal: '🗑️',
};

export interface ScopedOrg {
  id: string;
  name: string;
  organization_type: string;
  city?: string;
  logo_url?: string;
  partner_code?: string;
}

interface OrganizationScopeSelectorProps {
  assignments: any[];
  selectedOrgId: string | null; // null = aggregate view
  onSelectOrg: (orgId: string | null) => void;
}

const OrganizationScopeSelector = memo(({ assignments, selectedOrgId, onSelectOrg }: OrganizationScopeSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const orgs: ScopedOrg[] = assignments
    .map((a: any) => a.organization)
    .filter(Boolean)
    .filter((org: any, i: number, arr: any[]) => arr.findIndex((o: any) => o.id === org.id) === i);

  const filteredOrgs = orgs.filter(org =>
    !searchQuery || org.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOrg = selectedOrgId ? orgs.find(o => o.id === selectedOrgId) : null;

  // Aggregated stats
  const typeCount = orgs.reduce((acc, org) => {
    acc[org.organization_type] = (acc[org.organization_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
      <CardContent className="p-3">
        {/* Current Scope Indicator */}
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {selectedOrg ? (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  {orgTypeIcons[selectedOrg.organization_type] || '🏢'}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedOrg.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {orgTypeLabels[selectedOrg.organization_type] || selectedOrg.organization_type}
                    </Badge>
                    {selectedOrg.city && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{selectedOrg.city}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm">نظرة شاملة — جميع الجهات</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(typeCount).map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="text-[9px]">
                        {orgTypeIcons[type]} {count} {orgTypeLabels[type] || type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              <Users className="w-3 h-3 ml-1" />
              {orgs.length} جهة
            </Badge>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Expanded Org List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                {/* Search */}
                {orgs.length > 5 && (
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ابحث عن جهة..."
                      className="pr-9 h-8 text-sm"
                    />
                  </div>
                )}

                {/* Aggregate View Button */}
                <button
                  onClick={() => { onSelectOrg(null); setIsExpanded(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-right
                    ${!selectedOrgId ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <Globe className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">جميع الجهات (نظرة شاملة)</p>
                    <p className="text-[10px] text-muted-foreground">إحصائيات وتنبيهات مجمعة لكافة العملاء</p>
                  </div>
                  {!selectedOrgId && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </button>

                {/* Organization Cards */}
                <ScrollArea className={orgs.length > 6 ? 'h-64' : ''}>
                  <div className="space-y-1.5">
                    {filteredOrgs.map((org) => {
                      const isSelected = selectedOrgId === org.id;
                      return (
                        <button
                          key={org.id}
                          onClick={() => { onSelectOrg(org.id); setIsExpanded(false); }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-right
                            ${isSelected ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/50'}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm">
                            {orgTypeIcons[org.organization_type] || '🏢'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{org.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px]">
                                {orgTypeLabels[org.organization_type] || org.organization_type}
                              </Badge>
                              {org.city && (
                                <span className="text-[9px] text-muted-foreground">{org.city}</span>
                              )}
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>

                {filteredOrgs.length === 0 && searchQuery && (
                  <p className="text-center text-sm text-muted-foreground py-4">لا توجد نتائج لـ "{searchQuery}"</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
});

OrganizationScopeSelector.displayName = 'OrganizationScopeSelector';
export default OrganizationScopeSelector;
