import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowRight, GitBranch, Palette, Zap, Link2, ShieldCheck, ArrowLeftRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BINDING_DISPLAY } from '@/types/bindingTypes';
import type { BindingType } from '@/types/bindingTypes';
import { CHAIN_NODE_DISPLAY } from '@/types/actionChainTypes';
import type { ChainNodeType, ActionChain, ActionChainNode } from '@/types/actionChainTypes';
import { getOrgChains } from '@/config/actionChainsRegistry';

const BINDING_ORDER: BindingType[] = ['internal', 'partner', 'admin', 'hybrid'];

const SystemArchitectureGuide = () => {
  const { language } = useLanguage();
  const { organization } = useAuth();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const orgType = (organization?.organization_type as string) || 'transporter';
  const orgChains = getOrgChains(orgType);

  return (
          <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {isAr ? 'دليل البنية المعمارية' : 'Architecture Guide'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'شرح تفصيلي لسلاسل الإجراءات ونظام ألوان الارتباط الوظيفي'
              : 'Detailed explanation of action chains and functional binding color system'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="binding-colors" className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-r from-card via-card to-muted/20 p-1.5 shadow-sm">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent gap-1 h-auto p-0">
            <TabsTrigger value="binding-colors" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap rounded-xl px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <Palette className="w-3.5 h-3.5" />
              {isAr ? 'ألوان الارتباط' : 'Binding Colors'}
            </TabsTrigger>
            <TabsTrigger value="action-chains" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap rounded-xl px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <GitBranch className="w-3.5 h-3.5" />
              {isAr ? 'سلاسل الإجراءات' : 'Action Chains'}
            </TabsTrigger>
            <TabsTrigger value="node-types" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap rounded-xl px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
              <Zap className="w-3.5 h-3.5" />
              {isAr ? 'أنواع العقد' : 'Node Types'}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ Tab 1: Binding Colors ═══ */}
        <TabsContent value="binding-colors" className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              {isAr ? 'نظام ألوان الارتباط الوظيفي' : 'Functional Binding Color System'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'يصنّف كل عنصر في المنصة (تبويبات، روابط جانبية، إجراءات سريعة) إلى أحد أربعة أنواع ارتباط. كل نوع يُحدد العلاقة بين العنصر والأطراف المعنية (داخلي، شركاء، جهات رقابية، أو مزيج منها).'
                : 'Every element in the platform (tabs, sidebar links, quick actions) is classified into one of four binding types. Each type defines the relationship between the element and involved parties.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {BINDING_ORDER.map((type) => {
              const d = BINDING_DISPLAY[type];
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border border-border/40 p-5 space-y-3 ${d.bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full ${d.dotClass}`} />
                    <h3 className={`text-base font-bold ${d.colorClass}`}>
                      {d.emoji} {isAr ? d.labelAr : d.labelEn}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getBindingDescription(type, isAr)}
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isAr ? 'أمثلة:' : 'Examples:'}
                    </p>
                    {getBindingExamples(type, isAr).map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.dotClass}`} />
                        {ex}
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {isAr ? 'مرئي للرقيب:' : 'Admin Visible:'}{' '}
                      <span className="font-bold">
                        {type === 'admin' || type === 'hybrid' ? (isAr ? 'نعم ✓' : 'Yes ✓') : (isAr ? 'لا ✗' : 'No ✗')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Link2 className="w-3 h-3" />
                      {isAr ? 'يتطلب شريك:' : 'Requires Partner:'}{' '}
                      <span className="font-bold">
                        {type === 'partner' || type === 'hybrid' ? (isAr ? 'نعم ✓' : 'Yes ✓') : (isAr ? 'لا ✗' : 'No ✗')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Where binding appears */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-primary" />
              {isAr ? 'أين تظهر ألوان الارتباط؟' : 'Where Do Binding Colors Appear?'}
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { icon: '📑', titleAr: 'التبويبات', titleEn: 'Dashboard Tabs', descAr: 'نقطة ملونة بجانب اسم التبويب', descEn: 'Colored dot next to tab name' },
                { icon: '📋', titleAr: 'القائمة الجانبية', titleEn: 'Sidebar Items', descAr: 'مؤشر لوني بجانب كل رابط', descEn: 'Color indicator next to each link' },
                { icon: '⚡', titleAr: 'الإجراءات السريعة', titleEn: 'Quick Actions', descAr: 'تصنيف لوني لكل إجراء', descEn: 'Color classification per action' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl bg-muted/30 p-3 space-y-1">
                  <p className="text-sm font-bold">{item.icon} {isAr ? item.titleAr : item.titleEn}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ═══ Tab 2: Action Chains ═══ */}
        <TabsContent value="action-chains" className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary" />
              {isAr ? `سلاسل إجراءات ${orgChains?.labelAr || 'الجهة'}` : `${orgChains?.labelEn || 'Organization'} Action Chains`}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'كل سلسلة إجراءات تمثل تدفقاً وظيفياً كاملاً يبدأ بمحفز (زر أو حدث) ويمر عبر وظائف معالجة ونتائج وتأثيرات على أجزاء أخرى من النظام.'
                : 'Each action chain represents a complete functional flow starting with a trigger (button or event) passing through processing functions, results, and effects on other system parts.'}
            </p>
          </div>

          {orgChains?.chains.map((chain) => (
            <ChainCard key={chain.id} chain={chain} isAr={isAr} />
          ))}

          {!orgChains && (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 p-8 text-center">
              <p className="text-muted-foreground">
                {isAr ? 'لا توجد سلاسل إجراءات محددة لهذه الجهة' : 'No action chains defined for this organization type'}
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══ Tab 3: Node Types ═══ */}
        <TabsContent value="node-types" className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {isAr ? 'أنواع العقد في سلاسل الإجراءات' : 'Node Types in Action Chains'}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'كل عقدة في السلسلة تمثل خطوة محددة. العقد مصنفة إلى أربعة أنواع تحدد دورها في التدفق.'
                : 'Each node in the chain represents a specific step. Nodes are classified into four types defining their role in the flow.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(CHAIN_NODE_DISPLAY) as ChainNodeType[]).map((nodeType) => {
              const d = CHAIN_NODE_DISPLAY[nodeType];
              return (
                <motion.div
                  key={nodeType}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border border-border/40 p-5 space-y-3 ${d.bgClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{d.emoji}</span>
                    <h3 className={`text-base font-bold ${d.colorClass}`}>
                      {isAr ? d.labelAr : d.labelEn}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getNodeTypeDescription(nodeType, isAr)}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Flow diagram */}
          <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'التدفق النموذجي' : 'Typical Flow'}
            </h3>
            <div className="flex items-center justify-center gap-2 flex-wrap py-4">
              {(Object.keys(CHAIN_NODE_DISPLAY) as ChainNodeType[]).map((nodeType, i) => {
                const d = CHAIN_NODE_DISPLAY[nodeType];
                return (
                  <div key={nodeType} className="flex items-center gap-2">
                    <div className={`px-3 py-2 rounded-xl text-xs font-bold ${d.bgClass} ${d.colorClass}`}>
                      {d.emoji} {isAr ? d.labelAr : d.labelEn}
                    </div>
                    {i < 3 && <span className="text-muted-foreground text-lg">→</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ═══════════════════════════════════════════
// Chain Card Component
// ═══════════════════════════════════════════
const ChainCard = ({ chain, isAr }: { chain: ActionChain; isAr: boolean }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-start"
      >
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            {isAr ? chain.labelAr : chain.labelEn}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? chain.descriptionAr : chain.descriptionEn}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
            {chain.nodes.length} {isAr ? 'عقدة' : 'nodes'}
          </span>
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-muted-foreground"
          >
            ▾
          </motion.span>
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-border/30 p-4 space-y-2"
        >
          {chain.nodes.map((node, i) => (
            <NodeRow key={node.id} node={node} isAr={isAr} isLast={i === chain.nodes.length - 1} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

// ═══════════════════════════════════════════
// Node Row Component
// ═══════════════════════════════════════════
const NodeRow = ({ node, isAr, isLast }: { node: ActionChainNode; isAr: boolean; isLast: boolean }) => {
  const nodeDisplay = CHAIN_NODE_DISPLAY[node.nodeType];
  const bindingDisplay = BINDING_DISPLAY[node.bindingType];

  return (
    <div className="flex items-start gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center pt-1">
        <div className={`w-3 h-3 rounded-full shrink-0 ${bindingDisplay.dotClass}`} />
        {!isLast && <div className="w-0.5 h-8 bg-border/50 mt-1" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${nodeDisplay.bgClass} ${nodeDisplay.colorClass}`}>
            {nodeDisplay.emoji} {isAr ? nodeDisplay.labelAr : nodeDisplay.labelEn}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${bindingDisplay.bgClass} ${bindingDisplay.colorClass}`}>
            {bindingDisplay.emoji} {isAr ? bindingDisplay.labelAr : bindingDisplay.labelEn}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground mt-1">
          {isAr ? node.labelAr : node.labelEn}
        </p>
        {node.leadsTo && node.leadsTo.length > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            → {node.leadsTo.join(', ')}
          </p>
        )}
        {node.affects && node.affects.length > 0 && (
          <p className="text-[10px] text-amber-500 mt-0.5">
            ⚡ {isAr ? 'يؤثر على:' : 'Affects:'} {node.affects.join(', ')}
          </p>
        )}
      </div>
    </div>
        );
};

// ═══════════════════════════════════════════
// Helper functions
// ═══════════════════════════════════════════
function getBindingDescription(type: BindingType, isAr: boolean): string {
  const map: Record<BindingType, { ar: string; en: string }> = {
    internal: {
      ar: 'عمليات داخلية بحتة لا تتطلب تفاعلاً مع جهات خارجية. تشمل إدارة الأسطول والسائقين والصيانة والتدريب. البيانات غير مرئية للجهات الرقابية.',
      en: 'Purely internal operations that do not require interaction with external parties. Includes fleet management, drivers, maintenance, and training. Data is not visible to regulators.',
    },
    partner: {
      ar: 'عمليات تتطلب تعاوناً مع جهات خارجية مرتبطة (مولدين، مدورين، مرافق تخلص). تشمل طلبات الجمع، والتقييمات المتبادلة، والشراكات.',
      en: 'Operations requiring collaboration with linked external parties (generators, recyclers, disposal facilities). Includes collection requests, mutual ratings, and partnerships.',
    },
    admin: {
      ar: 'بيانات وعمليات مرتبطة بالامتثال الرقابي والإفصاح الحكومي. تشمل التراخيص، والإقرارات، وتقارير WMIS، والمخالفات. مرئية دائماً للجهات الرقابية.',
      en: 'Data and operations related to regulatory compliance and government disclosure. Includes licenses, declarations, WMIS reports, and violations. Always visible to regulators.',
    },
    hybrid: {
      ar: 'عمليات متكاملة تجمع بين البعد الداخلي والخارجي والرقابي. مثل الشحنات التي تبدأ داخلياً وتمر بالشركاء وتنتهي بتقارير رقابية.',
      en: 'Integrated operations combining internal, external, and regulatory dimensions. Like shipments that start internally, pass through partners, and end with regulatory reports.',
    },
  };
  return isAr ? map[type].ar : map[type].en;
}

function getBindingExamples(type: BindingType, isAr: boolean): string[] {
  const map: Record<BindingType, { ar: string[]; en: string[] }> = {
    internal: {
      ar: ['إدارة السائقين والتدريب', 'الصيانة الوقائية للأسطول', 'أنماط الجيلوش الأمنية', 'أرشيف النماذج اليدوية'],
      en: ['Driver management & training', 'Fleet preventive maintenance', 'Security guilloche patterns', 'Manual drafts archive'],
    },
    partner: {
      ar: ['طلبات الجمع من المولدين', 'الشحنات المرفوضة', 'بورصة المخلفات', 'التقييمات المتبادلة'],
      en: ['Collection requests from generators', 'Rejected shipments', 'Waste marketplace', 'Mutual partner ratings'],
    },
    admin: {
      ar: ['إقرارات التسليم الرقابية', 'شهادات التدوير الحكومية', 'تصاريح السائقين', 'تقارير ESG و WMIS'],
      en: ['Delivery declarations', 'Government recycling certs', 'Driver permits', 'ESG & WMIS reports'],
    },
    hybrid: {
      ar: ['دورة حياة الشحنة الكاملة', 'سلسلة الحفظ (Chain of Custody)', 'البصمة الكربونية', 'كشف التلاعب بالأوزان'],
      en: ['Full shipment lifecycle', 'Chain of Custody', 'Carbon footprint', 'Weight fraud detection'],
    },
  };
  return isAr ? map[type].ar : map[type].en;
}

function getNodeTypeDescription(nodeType: ChainNodeType, isAr: boolean): string {
  const map: Record<ChainNodeType, { ar: string; en: string }> = {
    trigger: {
      ar: 'نقطة البداية - زر يضغطه المستخدم أو حدث يحدث تلقائياً يُطلق سلسلة الإجراءات.',
      en: 'Starting point - a button pressed by user or an automatic event that triggers the action chain.',
    },
    function: {
      ar: 'خطوة معالجة وظيفية تنفذ عملية محددة مثل تعيين سائق أو تحسين مسار أو فحص جيوفنس.',
      en: 'A processing step that executes a specific operation like assigning a driver, optimizing route, or geofence check.',
    },
    result: {
      ar: 'مخرج ملموس من السلسلة مثل شهادة استلام، أو سائق معتمد، أو تقرير ESG.',
      en: 'A tangible output from the chain like a receipt certificate, certified driver, or ESG report.',
    },
    effect: {
      ar: 'تأثير غير مباشر على أجزاء أخرى من النظام مثل تحديث دفتر الحسابات أو تغذية بيانات الامتثال.',
      en: 'An indirect impact on other system parts like updating the ledger or feeding compliance data.',
    },
  };
  return isAr ? map[nodeType].ar : map[nodeType].en;
}

export default SystemArchitectureGuide;
