import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { History, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { VerificationHistory } from './types';
import { useLanguage } from '@/contexts/LanguageContext';

interface VerificationHistoryPanelProps {
  history: VerificationHistory[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const VerificationHistoryPanel = ({
  history,
  isOpen,
  onOpenChange,
}: VerificationHistoryPanelProps) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ar' ? ar : enUS;

  const getVerificationTypeLabel = (type: string) => {
    switch (type) {
      case 'auto': return t('verification.auto');
      case 'ai_analysis': return t('verification.aiAnalysis');
      default: return t('verification.manual');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            {t('verification.verificationLog')} ({history.length})
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-2">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('verification.noVerificationLog')}</p>
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-3 rounded-lg border text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">
                    {format(new Date(h.created_at), 'dd/MM/yyyy hh:mm a', { locale: dateLocale })}
                  </span>
                  <Badge variant="outline">
                    {getVerificationTypeLabel(h.verification_type)}
                  </Badge>
                </div>
                <p>{h.previous_status} ← {h.new_status}</p>
                {h.notes && <p className="text-muted-foreground mt-1">{h.notes}</p>}
              </div>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default VerificationHistoryPanel;
