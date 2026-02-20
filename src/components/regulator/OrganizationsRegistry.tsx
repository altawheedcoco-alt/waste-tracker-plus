import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useAllOrganizations } from '@/hooks/useRegulatorData';
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

const OrganizationsRegistry = () => {
  const { data: orgs = [], isLoading } = useAllOrganizations();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="w-5 h-5 text-primary" />
          سجل المنظمات ({orgs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Type summary badges */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <Badge
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
            >
              {ORG_TYPE_MAP[type] || type}: {count as number}
            </Badge>
          ))}
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
              {Object.entries(ORG_TYPE_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
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
                  <th className="p-2">المحافظة</th>
                  <th className="p-2">التحقق</th>
                  <th className="p-2">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org: any) => (
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
                    <td className="p-2 text-muted-foreground">{org.governorate || '-'}</td>
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
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-6">لا توجد نتائج</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationsRegistry;
