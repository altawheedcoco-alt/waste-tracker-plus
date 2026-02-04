import { Loader2, FileCheck, Plus, Search, CheckCircle2, Clock, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackButton from '@/components/ui/back-button';
import ContractsList from '@/components/contracts/ContractsList';
import ContractFormDialog from '@/components/contracts/ContractFormDialog';
import ContractViewDialog from '@/components/contracts/ContractViewDialog';
import { useContracts } from '@/hooks/useContracts';

const Contracts = () => {
  const {
    loading,
    searchQuery,
    setSearchQuery,
    showAddDialog,
    setShowAddDialog,
    showViewDialog,
    setShowViewDialog,
    selectedContract,
    setSelectedContract,
    isEditing,
    saving,
    formData,
    setFormData,
    expiredContracts,
    activeContracts,
    pendingContracts,
    handleSubmit,
    handleDelete,
    handleEdit,
    resetForm,
    getContractStatus,
    getDaysUntilExpiry,
    filterContracts,
  } = useContracts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/dashboard" />
            <div className="text-right">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileCheck className="w-6 h-6" />
                إدارة العقود
              </h1>
              <p className="text-muted-foreground">إدارة العقود والاتفاقيات مع الشركاء</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة عقد
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عقود سارية</p>
                  <p className="text-2xl font-bold text-primary">{activeContracts.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">قيد العمل</p>
                  <p className="text-2xl font-bold text-secondary-foreground">{pendingContracts.length}</p>
                </div>
                <Clock className="w-8 h-8 text-secondary-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">منتهية</p>
                  <p className="text-2xl font-bold text-destructive">{expiredContracts.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في العقود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="gap-1">
              <CheckCircle2 className="w-4 h-4" />
              عقود سارية ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="w-4 h-4" />
              قيد العمل ({pendingContracts.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-1">
              <XCircle className="w-4 h-4" />
              منتهية ({expiredContracts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ContractsList 
                contracts={activeContracts} 
                emptyMessage="لا توجد عقود سارية حالياً"
                filterContracts={filterContracts}
                onView={(c) => { setSelectedContract(c); setShowViewDialog(true); }}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getContractStatus={getContractStatus}
                getDaysUntilExpiry={getDaysUntilExpiry}
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ContractsList 
                contracts={pendingContracts} 
                emptyMessage="لا توجد عقود قيد العمل"
                filterContracts={filterContracts}
                onView={(c) => { setSelectedContract(c); setShowViewDialog(true); }}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getContractStatus={getContractStatus}
                getDaysUntilExpiry={getDaysUntilExpiry}
              />
            )}
          </TabsContent>

          <TabsContent value="expired" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ContractsList 
                contracts={expiredContracts} 
                emptyMessage="لا توجد عقود منتهية"
                filterContracts={filterContracts}
                onView={(c) => { setSelectedContract(c); setShowViewDialog(true); }}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getContractStatus={getContractStatus}
                getDaysUntilExpiry={getDaysUntilExpiry}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <ContractFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          isEditing={isEditing}
          saving={saving}
          onReset={resetForm}
        />

        {/* View Dialog */}
        <ContractViewDialog
          open={showViewDialog}
          onOpenChange={setShowViewDialog}
          contract={selectedContract}
          getContractStatus={getContractStatus}
        />
      </div>
    </DashboardLayout>
  );
};

export default Contracts;
