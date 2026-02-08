 import { useState, useEffect } from 'react';
 import { motion } from 'framer-motion';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { toast } from 'sonner';
 import {
   Building2,
   Factory,
   Truck,
   Recycle,
   Search,
   Eye,
   LayoutDashboard,
   Loader2,
   Users,
   FileText,
   Package,
   ChevronLeft,
 } from 'lucide-react';
 
 interface Organization {
   id: string;
   name: string;
   organization_type: 'generator' | 'transporter' | 'recycler' | 'disposal';
   city: string | null;
   is_verified: boolean;
   logo_url: string | null;
   email: string | null;
   phone: string | null;
 }
 
 interface OrganizationStats {
   shipmentsCount: number;
   employeesCount: number;
   postsCount: number;
 }
 
 const AdminDashboardSwitcher = () => {
   const [open, setOpen] = useState(false);
   const [organizations, setOrganizations] = useState<Organization[]>([]);
   const [loading, setLoading] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
   const [orgStats, setOrgStats] = useState<OrganizationStats | null>(null);
   const [loadingStats, setLoadingStats] = useState(false);
   const [activeTab, setActiveTab] = useState('all');
 
   useEffect(() => {
     if (open) {
       fetchOrganizations();
     }
   }, [open]);
 
   const fetchOrganizations = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('organizations')
         .select('id, name, organization_type, city, is_verified, logo_url, email, phone')
         .order('name');
 
       if (error) throw error;
       setOrganizations(data || []);
     } catch (error) {
       console.error('Error fetching organizations:', error);
       toast.error('فشل في تحميل الجهات');
     } finally {
       setLoading(false);
     }
   };
 
   const fetchOrgStats = async (orgId: string) => {
     setLoadingStats(true);
     try {
       const [shipmentsRes, employeesRes, postsRes] = await Promise.all([
         supabase
           .from('shipments')
           .select('id', { count: 'exact', head: true })
           .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`),
         supabase
           .from('profiles')
           .select('id', { count: 'exact', head: true })
           .eq('organization_id', orgId),
         supabase
           .from('organization_posts')
           .select('id', { count: 'exact', head: true })
           .eq('organization_id', orgId),
       ]);
 
       setOrgStats({
         shipmentsCount: shipmentsRes.count || 0,
         employeesCount: employeesRes.count || 0,
         postsCount: postsRes.count || 0,
       });
     } catch (error) {
       console.error('Error fetching org stats:', error);
     } finally {
       setLoadingStats(false);
     }
   };
 
   const handleSelectOrg = (org: Organization) => {
     setSelectedOrg(org);
     fetchOrgStats(org.id);
   };
 
   const getOrgTypeInfo = (type: string) => {
     switch (type) {
       case 'generator':
         return { label: 'منشأة مولدة', icon: Factory, color: 'bg-blue-500' };
       case 'transporter':
         return { label: 'جهة ناقلة', icon: Truck, color: 'bg-amber-500' };
       case 'recycler':
         return { label: 'جهة معالجة', icon: Recycle, color: 'bg-green-500' };
       default:
         return { label: 'جهة', icon: Building2, color: 'bg-gray-500' };
     }
   };
 
   const filteredOrgs = organizations.filter(org => {
     const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       org.city?.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesTab = activeTab === 'all' || org.organization_type === activeTab;
     return matchesSearch && matchesTab;
   });
 
   const orgCounts = {
     all: organizations.length,
     generator: organizations.filter(o => o.organization_type === 'generator').length,
     transporter: organizations.filter(o => o.organization_type === 'transporter').length,
     recycler: organizations.filter(o => o.organization_type === 'recycler').length,
   };
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button variant="outline" className="gap-2">
           <LayoutDashboard className="h-4 w-4" />
           عرض لوحات تحكم الجهات
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-4xl max-h-[85vh]" dir="rtl">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Building2 className="h-5 w-5 text-primary" />
             لوحات تحكم جميع الجهات
           </DialogTitle>
         </DialogHeader>
 
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[60vh]">
           {/* Organizations List */}
           <div className="space-y-4">
             <div className="relative">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="البحث عن جهة..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pr-10"
               />
             </div>
 
             <Tabs value={activeTab} onValueChange={setActiveTab}>
               <TabsList className="w-full grid grid-cols-4">
                 <TabsTrigger value="all" className="text-xs">
                   الكل ({orgCounts.all})
                 </TabsTrigger>
                 <TabsTrigger value="generator" className="text-xs">
                   <Factory className="h-3 w-3 ml-1" />
                   ({orgCounts.generator})
                 </TabsTrigger>
                 <TabsTrigger value="transporter" className="text-xs">
                   <Truck className="h-3 w-3 ml-1" />
                   ({orgCounts.transporter})
                 </TabsTrigger>
                 <TabsTrigger value="recycler" className="text-xs">
                   <Recycle className="h-3 w-3 ml-1" />
                   ({orgCounts.recycler})
                 </TabsTrigger>
               </TabsList>
             </Tabs>
 
             <ScrollArea className="h-[45vh]">
               {loading ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                 </div>
               ) : filteredOrgs.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   لا توجد جهات
                 </div>
               ) : (
                 <div className="space-y-2 pl-2">
                   {filteredOrgs.map((org) => {
                     const typeInfo = getOrgTypeInfo(org.organization_type);
                     const TypeIcon = typeInfo.icon;
                     const isSelected = selectedOrg?.id === org.id;
 
                     return (
                       <motion.div
                         key={org.id}
                         whileHover={{ scale: 1.01 }}
                         whileTap={{ scale: 0.99 }}
                       >
                         <Card
                           className={`cursor-pointer transition-all ${
                             isSelected
                               ? 'border-primary bg-primary/5 shadow-md'
                               : 'hover:border-primary/50'
                           }`}
                           onClick={() => handleSelectOrg(org)}
                         >
                           <CardContent className="p-3">
                             <div className="flex items-center gap-3">
                               <div className={`p-2 rounded-lg ${typeInfo.color} text-white`}>
                                 <TypeIcon className="h-4 w-4" />
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2">
                                   <p className="font-medium truncate">{org.name}</p>
                                   {org.is_verified && (
                                     <Badge variant="secondary" className="text-xs">موثق</Badge>
                                   )}
                                 </div>
                                 <p className="text-xs text-muted-foreground">
                                   {typeInfo.label} • {org.city || 'غير محدد'}
                                 </p>
                               </div>
                               <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                             </div>
                           </CardContent>
                         </Card>
                       </motion.div>
                     );
                   })}
                 </div>
               )}
             </ScrollArea>
           </div>
 
           {/* Organization Details */}
           <div className="border-r pr-4">
             {selectedOrg ? (
               <motion.div
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="space-y-4"
               >
                 <Card>
                   <CardHeader className="pb-2">
                     <div className="flex items-center gap-3">
                       {selectedOrg.logo_url ? (
                         <img
                           src={selectedOrg.logo_url}
                           alt={selectedOrg.name}
                           className="w-12 h-12 rounded-lg object-cover"
                         />
                       ) : (
                         <div className={`p-3 rounded-lg ${getOrgTypeInfo(selectedOrg.organization_type).color} text-white`}>
                           {(() => {
                             const Icon = getOrgTypeInfo(selectedOrg.organization_type).icon;
                             return <Icon className="h-6 w-6" />;
                           })()}
                         </div>
                       )}
                       <div>
                         <CardTitle className="text-lg">{selectedOrg.name}</CardTitle>
                         <p className="text-sm text-muted-foreground">
                           {getOrgTypeInfo(selectedOrg.organization_type).label}
                         </p>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="space-y-2 text-sm">
                     {selectedOrg.email && (
                       <p><span className="text-muted-foreground">البريد:</span> {selectedOrg.email}</p>
                     )}
                     {selectedOrg.phone && (
                       <p><span className="text-muted-foreground">الهاتف:</span> {selectedOrg.phone}</p>
                     )}
                     {selectedOrg.city && (
                       <p><span className="text-muted-foreground">المدينة:</span> {selectedOrg.city}</p>
                     )}
                   </CardContent>
                 </Card>
 
                 {/* Stats */}
                 {loadingStats ? (
                   <div className="flex items-center justify-center py-4">
                     <Loader2 className="h-5 w-5 animate-spin" />
                   </div>
                 ) : orgStats && (
                   <div className="grid grid-cols-3 gap-2">
                     <Card className="p-3 text-center">
                       <Package className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                       <p className="text-lg font-bold">{orgStats.shipmentsCount}</p>
                       <p className="text-xs text-muted-foreground">شحنة</p>
                     </Card>
                     <Card className="p-3 text-center">
                       <Users className="h-5 w-5 mx-auto text-green-500 mb-1" />
                       <p className="text-lg font-bold">{orgStats.employeesCount}</p>
                       <p className="text-xs text-muted-foreground">موظف</p>
                     </Card>
                     <Card className="p-3 text-center">
                       <FileText className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                       <p className="text-lg font-bold">{orgStats.postsCount}</p>
                       <p className="text-xs text-muted-foreground">منشور</p>
                     </Card>
                   </div>
                 )}
 
                 {/* Actions */}
                 <div className="space-y-2">
                   <Button 
                     className="w-full" 
                     onClick={() => {
                       window.open(`/dashboard/organization/${selectedOrg.id}`, '_blank');
                       toast.success(`جاري فتح لوحة تحكم ${selectedOrg.name}`);
                     }}
                   >
                     <Eye className="h-4 w-4 ml-2" />
                     عرض لوحة التحكم
                   </Button>
                   <Button 
                     variant="outline" 
                     className="w-full"
                     onClick={() => {
                       window.open(`/dashboard/shipments?org=${selectedOrg.id}`, '_blank');
                     }}
                   >
                     <Package className="h-4 w-4 ml-2" />
                     عرض شحنات الجهة
                   </Button>
                   <Button 
                     variant="outline" 
                     className="w-full"
                     onClick={() => {
                       window.open(`/organization/${selectedOrg.id}`, '_blank');
                     }}
                   >
                     <Building2 className="h-4 w-4 ml-2" />
                     عرض صفحة الجهة
                   </Button>
                 </div>
               </motion.div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                 <Building2 className="h-12 w-12 mb-4 opacity-50" />
                 <p>اختر جهة من القائمة لعرض تفاصيلها</p>
               </div>
             )}
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default AdminDashboardSwitcher;