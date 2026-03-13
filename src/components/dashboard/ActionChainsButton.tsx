import { GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface ActionChainsButtonProps {
  isCollapsed?: boolean;
}

const ActionChainsButton = ({ isCollapsed = false }: ActionChainsButtonProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const label = isAr ? 'سلاسل الإجراءات' : 'Action Chains';

  const button = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/dashboard/action-chains')}
      className={`w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 ${
        isCollapsed ? 'justify-center px-2' : 'justify-start'
      }`}
    >
      <GitBranch className="w-4 h-4 shrink-0 text-primary" />
      {!isCollapsed && (
        <span className="text-xs font-medium truncate">{label}</span>
      )}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="left">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

export default ActionChainsButton;
