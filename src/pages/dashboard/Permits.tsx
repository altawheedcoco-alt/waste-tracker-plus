import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, FileText, Settings, Loader2 } from 'lucide-react';
import { usePermits, Permit } from '@/hooks/usePermits';
import PermitCard from '@/components/permits/PermitCard';
import CreatePermitDialog from '@/components/permits/CreatePermitDialog';
import SignPermitDialog from '@/components/permits/SignPermitDialog';
import PermitSignatoryRolesManager from '@/components/permits/PermitSignatoryRolesManager';
import PermitViewDialog from '@/components/permits/PermitViewDialog';

const Permits = () => {
  const { permits, signatoryRoles, isLoading } = usePermits();
  const [createOpen, setCreateOpen] = useState(false);
  const [signPermit, setSignPermit] = useState<Permit | null>(null);
  const [viewPermit, setViewPermit] = useState<Permit | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = permits.filter(p => {
    const matchesSearch = !search || p.permit_number.includes(search) || p.purpose?.includes(search) || p.person_name?.includes(search);
    const matchesType = filterType === 'all' || p.permit_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            التصاريح والأذونات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة التصاريح والأذونات الرسمية مع توقيعات متعددة الأطراف
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          تصريح جديد
        </Button>
      </div>

      <Tabs defaultValue="permits">
        <TabsList>
          <TabsTrigger value="permits" className="gap-1">
            <FileText className="w-4 h-4" />
            التصاريح
            <Badge variant="secondary" className="text-[10px] mr-1">{permits.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1">
            <Settings className="w-4 h-4" />
            أدوار التوقيع
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permits" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالرقم أو الغرض أو الشخص..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع التصريح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="waste_exit">خروج مخلفات</SelectItem>
                <SelectItem value="person_access">شخص / سائق</SelectItem>
                <SelectItem value="transport">نقل</SelectItem>
                <SelectItem value="general">عام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد تصاريح بعد</p>
              <Button variant="link" onClick={() => setCreateOpen(true)}>
                إنشاء أول تصريح
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(permit => (
                <PermitCard
                  key={permit.id}
                  permit={permit}
                  onView={setViewPermit}
                  onSign={setSignPermit}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <PermitSignatoryRolesManager />
        </TabsContent>
      </Tabs>

      <CreatePermitDialog open={createOpen} onOpenChange={setCreateOpen} />
      <SignPermitDialog
        open={!!signPermit}
        onOpenChange={open => !open && setSignPermit(null)}
        permit={signPermit}
        signatoryRoles={signatoryRoles}
      />
      <PermitViewDialog
        open={!!viewPermit}
        onOpenChange={open => !open && setViewPermit(null)}
        permit={viewPermit}
      />
    </div>
  );
};

export default Permits;
