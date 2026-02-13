import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { 
  Building2, Search, Factory, Recycle, Truck, TrendingUp, TrendingDown,
  Users, UserPlus, ExternalLink, Wallet, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartnerAccounts, type PartnerBalance } from '@/hooks/usePartnerAccounts';
import CreateExternalPartnerDialog from '@/components/partners/CreateExternalPartnerDialog';
import AccountSummaryCard from '@/components/accounts/AccountSummaryCard';
import DepositButton from '@/components/deposits/DepositButton';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PartnerAccounts() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { 
    partnerBalances, balancesLoading, partnerTypes, filteredBalances,
    calculateTotals, organizationType 
  } = usePartnerAccounts();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<'generator' | 'recycler' | 'guest'>('generator');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount);
  };

  const partnerTypeConfig: Record<string, { labelKey: string; singularKey: string; icon: typeof Factory; color: string; bgColor: string }> = {
    generator: { labelKey: 'partnerAccounts.generators', singularKey: 'partnerAccounts.generator', icon: Factory, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
    recycler: { labelKey: 'partnerAccounts.recyclers', singularKey: 'partnerAccounts.recycler', icon: Recycle, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
    transporter: { labelKey: 'partnerAccounts.transporters', singularKey: 'partnerAccounts.transporter', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    guest: { labelKey: 'partnerAccounts.externalClients', singularKey: 'partnerAccounts.externalClient', icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  };

  const getPartnerTypeInfo = (type: string) => {
    const config = partnerTypeConfig[type];
    if (!config) return { label: t('partnerAccounts.partners'), singular: t('partnerAccounts.partner'), icon: Building2, color: 'text-muted-foreground', bgColor: 'bg-muted' };
    return { label: t(config.labelKey), singular: t(config.singularKey), icon: config.icon, color: config.color, bgColor: config.bgColor };
  };

  const getPageTitle = () => {
    switch (organizationType) {
      case 'transporter': return t('partnerAccounts.transporterTitle');
      case 'generator': return t('partnerAccounts.generatorTitle');
      case 'recycler': return t('partnerAccounts.recyclerTitle');
      default: return t('partnerAccounts.defaultTitle');
    }
  };

  const globalTotals = useMemo(() => {
    let totalReceivables = 0, totalPayables = 0, totalPartners = 0;
    partnerTypes.forEach(type => {
      const balances = filteredBalances(type);
      const { totalReceivables: r, totalPayables: p } = calculateTotals(balances);
      totalReceivables += r; totalPayables += p; totalPartners += balances.length;
    });
    return { totalReceivables, totalPayables, totalPartners, netBalance: totalReceivables - totalPayables };
  }, [partnerTypes, filteredBalances, calculateTotals]);

  const handleViewPartnerAccount = (balance: PartnerBalance) => {
    if (balance.isExternal) navigate(`/dashboard/external-partner/${balance.external_partner_id}`);
    else navigate(`/dashboard/partner-account/${balance.partner_organization_id}`);
  };

  const handleCreatePartner = (type: 'generator' | 'recycler' | 'guest') => {
    setCreateDialogType(type); setShowCreateDialog(true);
  };

  const renderPartnerTable = (balances: PartnerBalance[], type: string) => {
    const typeInfo = getPartnerTypeInfo(type);
    const Icon = typeInfo.icon;
    const filtered = balances.filter(balance => 
      balance.partner_organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const { totalReceivables, totalPayables } = calculateTotals(filtered);

    if (balancesLoading) {
      return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>;
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
          <Icon className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">{t('partnerAccounts.noPartnersYet').replace('{type}', typeInfo.label)}</p>
          <p className="text-sm mb-6 opacity-80">{t('partnerAccounts.addPartnerHint')}</p>
          <Button onClick={() => handleCreatePartner(type as 'generator' | 'recycler' | 'guest')} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t('partnerAccounts.addPartner')} {typeInfo.singular}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('partnerAccounts.receivable')}</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalReceivables)} ج.م</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">{t('partnerAccounts.payable')}</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(totalPayables)} ج.م</p>
            </div>
          </div>
        </div>

        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-center font-bold w-12">#</TableHead>
                <TableHead className="font-bold">{t('partnerAccounts.partnerName')}</TableHead>
                <TableHead className="text-center font-bold">{t('partnerAccounts.shipmentsCount')}</TableHead>
                <TableHead className="text-center font-bold">{t('partnerAccounts.shipmentsValue')}</TableHead>
                <TableHead className="text-center font-bold">{t('partnerAccounts.paid')}</TableHead>
                <TableHead className="text-center font-bold">{t('partnerAccounts.balance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((balance, index) => {
                const balanceAmount = balance.balance || 0;
                const isCreditor = balanceAmount > 0;
                const isZero = balanceAmount === 0;
                return (
                  <TableRow key={balance.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewPartnerAccount(balance)}>
                    <TableCell className="text-center text-muted-foreground font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2.5 rounded-lg', typeInfo.bgColor, typeInfo.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium block">{balance.partner_organization?.name || t('partnerAccounts.notDetermined')}</span>
                          {balance.isExternal && (
                            <Badge variant="outline" className="text-xs gap-1 mt-0.5">
                              <ExternalLink className="h-3 w-3" />
                              {t('partnerAccounts.external')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="font-medium">{balance.shipments_count || 0}</Badge></TableCell>
                    <TableCell className="text-center font-medium">{formatCurrency(balance.total_shipment_value || 0)} ج.م</TableCell>
                    <TableCell className="text-center text-emerald-600 font-medium">{formatCurrency(balance.total_paid)} ج.م</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={cn('font-bold text-lg', isCreditor ? 'text-emerald-600' : isZero ? 'text-muted-foreground' : 'text-red-600')}>
                          {formatCurrency(Math.abs(balanceAmount))}
                        </span>
                        {!isZero && (
                          <Badge variant="outline" className={cn('text-xs', isCreditor ? 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' : 'border-red-300 text-red-600 bg-red-50 dark:bg-red-950/20')}>
                            {isCreditor ? t('partnerAccounts.receivable') : t('partnerAccounts.payable')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>{t('partnerAccounts.totalOf')} {typeInfo.label}: <strong>{filtered.length}</strong></span>
          <span>({filtered.filter(b => !b.isExternal).length} {t('partnerAccounts.registered')}، {filtered.filter(b => b.isExternal).length} {t('partnerAccounts.external')})</span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><Wallet className="h-6 w-6 text-primary" /></div>
              {getPageTitle()}
            </h1>
            <p className="text-muted-foreground mt-1">{t('partnerAccounts.subtitle')}</p>
          </div>
          <div className="flex gap-2 self-start lg:self-center">
            <DepositButton />
            <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              {t('partnerAccounts.addExternalPartner')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AccountSummaryCard title={t('partnerAccounts.totalPartners')} value={globalTotals.totalPartners} icon={Users} variant="info" formatValue={(v) => String(v)} />
          <AccountSummaryCard title={t('partnerAccounts.receivable')} value={globalTotals.totalReceivables} icon={TrendingUp} variant="success" />
          <AccountSummaryCard title={t('partnerAccounts.payable')} value={globalTotals.totalPayables} icon={TrendingDown} variant="danger" />
          <AccountSummaryCard title={t('partnerAccounts.netBalance')} value={Math.abs(globalTotals.netBalance)} subtitle={globalTotals.netBalance >= 0 ? t('partnerAccounts.inOurFavor') : t('partnerAccounts.weOwe')} icon={Wallet} variant={globalTotals.netBalance >= 0 ? 'success' : 'warning'} />
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('partnerAccounts.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10 h-11" />
        </div>

        {partnerTypes.length > 0 && (
          <Tabs defaultValue={partnerTypes[0]} className="w-full">
            <TabsList className="w-full max-w-xl grid" style={{ gridTemplateColumns: `repeat(${partnerTypes.length}, 1fr)` }}>
              {partnerTypes.map((type) => {
                const typeInfo = getPartnerTypeInfo(type);
                const Icon = typeInfo.icon;
                const count = filteredBalances(type).length;
                return (
                  <TabsTrigger key={type} value={type} className="gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{typeInfo.label}</span>
                    {count > 0 && <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">{count}</Badge>}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {partnerTypes.map((type) => (
              <TabsContent key={type} value={type} className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {(() => { const ti = getPartnerTypeInfo(type); const I = ti.icon; return <><I className={cn('h-5 w-5', ti.color)} />{t('partnerAccounts.accountsOf')} {ti.label}</>; })()}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleCreatePartner(type as 'generator' | 'recycler' | 'guest')} className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      {t('partnerAccounts.addPartner')} {getPartnerTypeInfo(type).singular}
                    </Button>
                  </CardHeader>
                  <CardContent>{renderPartnerTable(filteredBalances(type), type)}</CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {partnerTypes.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">{t('partnerAccounts.cannotDetermineOrgType')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateExternalPartnerDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} defaultType={createDialogType} />
    </DashboardLayout>
  );
}
