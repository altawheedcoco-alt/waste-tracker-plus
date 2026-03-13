import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GitBranch, ArrowRight, Palette, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOrgChains, ACTION_CHAINS_REGISTRY } from '@/config/actionChainsRegistry';
import ActionChainTree from '@/components/shared/ActionChainTree';
import { CHAIN_NODE_DISPLAY } from '@/types/actionChainTypes';
import type { ChainNodeType } from '@/types/actionChainTypes';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

const ActionChainsPage = () => {
  const { language } = useLanguage();
  const { organization } = useAuth();
  const isAr = language === 'ar';

  const orgType = (organization?.organization_type as string) || 'transporter';
  const currentOrgChains = getOrgChains(orgType);
  const allOrgTypes = Object.keys(ACTION_CHAINS_REGISTRY);

  return (
    <DashboardLayout>
      <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-primary" />
              {isAr ? 'سلاسل الإجراءات' : 'Action Chains'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'عرض شامل لجميع سلاسل الإجراءات والتدفقات الوظيفية لكل جهة'
                : 'Complete overview of all action chains and functional flows per organization type'}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-border/40 bg-gradient-to-r from-primary/5 to-transparent p-5 space-y-2">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isAr ? 'ما هي سلاسل الإجراءات؟' : 'What are Action Chains?'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {isAr
                  ? 'كل سلسلة إجراءات تمثل تدفقاً وظيفياً كاملاً يبدأ بمحفز (زر أو حدث) ويمر عبر وظائف معالجة ونتائج وتأثيرات على أجزاء أخرى من النظام. هذا يساعدك على فهم كيف ترتبط العمليات ببعضها.'
                  : 'Each action chain represents a complete functional flow starting with a trigger (button or event) passing through processing functions, results, and effects on other system parts. This helps you understand how operations are interconnected.'}
              </p>
            </div>
          </div>
        </div>

        {/* Node Types Legend */}
        <div className="rounded-2xl border border-border/40 bg-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            {isAr ? 'أنواع العقد' : 'Node Types'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(CHAIN_NODE_DISPLAY) as ChainNodeType[]).map((nodeType) => {
              const d = CHAIN_NODE_DISPLAY[nodeType];
              return (
                <motion.div
                  key={nodeType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl p-3 space-y-1 ${d.bgClass} border border-border/30`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.emoji}</span>
                    <span className={`text-xs font-bold ${d.colorClass}`}>
                      {isAr ? d.labelAr : d.labelEn}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Flow diagram */}
          <div className="flex items-center justify-center gap-2 flex-wrap py-3 mt-3 border-t border-border/30">
            {(Object.keys(CHAIN_NODE_DISPLAY) as ChainNodeType[]).map((nodeType, i) => {
              const d = CHAIN_NODE_DISPLAY[nodeType];
              return (
                <div key={nodeType} className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${d.bgClass} ${d.colorClass}`}>
                    {d.emoji} {isAr ? d.labelAr : d.labelEn}
                  </div>
                  {i < 3 && <span className="text-muted-foreground">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs per org type */}
        <Tabs defaultValue={orgType} className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/30 bg-card p-1.5">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-1 h-auto p-0">
              {allOrgTypes.map((type) => {
                const chains = ACTION_CHAINS_REGISTRY[type];
                const isCurrentOrg = type === orgType;
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="gap-1.5 text-xs sm:text-sm whitespace-nowrap rounded-xl px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    {isAr ? chains.labelAr : chains.labelEn}
                    {isCurrentOrg && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {isAr ? 'أنت' : 'You'}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {allOrgTypes.map((type) => {
            const chains = ACTION_CHAINS_REGISTRY[type];
            return (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="rounded-2xl border border-border/40 bg-card p-4">
                  <ActionChainTree orgChains={chains} />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ActionChainsPage;
