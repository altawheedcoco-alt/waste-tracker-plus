import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { BINDING_DISPLAY } from '@/types/bindingTypes';
import { CHAIN_NODE_DISPLAY } from '@/types/actionChainTypes';
import type { ActionChain, ActionChainNode, ChainNodeType } from '@/types/actionChainTypes';
import type { OrgActionChains } from '@/types/actionChainTypes';
import { ChevronDown, ChevronLeft, ChevronRight, ArrowDown, Zap, Link2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ActionChainTreeProps {
  orgChains: OrgActionChains;
  className?: string;
}

const NodeTypeIcon = ({ type }: { type: ChainNodeType }) => {
  const d = CHAIN_NODE_DISPLAY[type];
  return <span className="text-xs">{d.emoji}</span>;
};

const ChainNodeCard = memo(({ node, language, isLast }: { node: ActionChainNode; language: string; isLast: boolean }) => {
  const bindingD = BINDING_DISPLAY[node.bindingType];
  const nodeD = CHAIN_NODE_DISPLAY[node.nodeType];
  const label = language === 'ar' ? node.labelAr : node.labelEn;

  return (
    <div className="flex flex-col items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-default',
              'hover:shadow-md hover:scale-[1.02]',
              nodeD.bgClass,
              'border-border/50'
            )}
          >
            {/* Binding dot */}
            <span className={cn('w-2 h-2 rounded-full shrink-0', bindingD.dotClass)} />
            {/* Node type */}
            <NodeTypeIcon type={node.nodeType} />
            {/* Label */}
            <span className={cn('text-xs font-medium', nodeD.colorClass)}>
              {label}
            </span>
            {/* Linked indicator */}
            {(node.linkedTab || node.linkedPath) && (
              <Link2 className="w-3 h-3 text-muted-foreground/60" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[200px] space-y-1">
          <div className="font-medium">{label}</div>
          <div className="flex items-center gap-1">
            <span className={cn('w-1.5 h-1.5 rounded-full', bindingD.dotClass)} />
            <span className={bindingD.colorClass}>
              {language === 'ar' ? bindingD.labelAr : bindingD.labelEn}
            </span>
          </div>
          <div className="text-muted-foreground">
            {language === 'ar' ? nodeD.labelAr : nodeD.labelEn}
          </div>
          {node.affects && node.affects.length > 0 && (
            <div className="text-orange-500 text-[10px]">
              🔄 {language === 'ar' ? 'يؤثر على سلاسل أخرى' : 'Affects other chains'}
            </div>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Connector arrow */}
      {!isLast && (
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-3 bg-border" />
          <ArrowDown className="w-3 h-3 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
});
ChainNodeCard.displayName = 'ChainNodeCard';

const ChainSection = memo(({ chain, language }: { chain: ActionChain; language: string }) => {
  const [expanded, setExpanded] = useState(false);
  const label = language === 'ar' ? chain.labelAr : chain.labelEn;
  const desc = language === 'ar' ? chain.descriptionAr : chain.descriptionEn;
  const isRtl = language === 'ar';
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  // Group nodes by type for legend
  const typeCount = useMemo(() => {
    const counts: Partial<Record<ChainNodeType, number>> = {};
    chain.nodes.forEach(n => { counts[n.nodeType] = (counts[n.nodeType] || 0) + 1; });
    return counts;
  }, [chain.nodes]);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-start transition-colors',
          'hover:bg-muted/30',
        )}
      >
        <Zap className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{label}</div>
          <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
        </div>
        {/* Mini type badges */}
        <div className="hidden sm:flex items-center gap-1">
          {(Object.entries(typeCount) as [ChainNodeType, number][]).map(([t, c]) => {
            const d = CHAIN_NODE_DISPLAY[t];
            return (
              <span key={t} className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium', d.bgClass, d.colorClass)}>
                {d.emoji}{c}
              </span>
            );
          })}
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col items-center border-t border-border/30">
              {chain.nodes.map((node, idx) => (
                <ChainNodeCard
                  key={node.id}
                  node={node}
                  language={language}
                  isLast={idx === chain.nodes.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
ChainSection.displayName = 'ChainSection';

const ActionChainTree = memo(({ orgChains, className }: ActionChainTreeProps) => {
  const { language } = useLanguage();
  const orgLabel = language === 'ar' ? orgChains.labelAr : orgChains.labelEn;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h3 className="text-sm font-bold">
          {language === 'ar' ? `سلاسل إجراءات ${orgLabel}` : `${orgLabel} Action Chains`}
        </h3>
      </div>

      {/* Node type legend */}
      <div className="flex flex-wrap gap-2 px-1">
        {(Object.entries(CHAIN_NODE_DISPLAY) as [ChainNodeType, typeof CHAIN_NODE_DISPLAY[ChainNodeType]][]).map(([type, d]) => (
          <span key={type} className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full', d.bgClass, d.colorClass)}>
            {d.emoji} {language === 'ar' ? d.labelAr : d.labelEn}
          </span>
        ))}
      </div>

      {/* Chains */}
      <div className="space-y-2">
        {orgChains.chains.map(chain => (
          <ChainSection key={chain.id} chain={chain} language={language} />
        ))}
      </div>
    </div>
  );
});

ActionChainTree.displayName = 'ActionChainTree';

export default ActionChainTree;
