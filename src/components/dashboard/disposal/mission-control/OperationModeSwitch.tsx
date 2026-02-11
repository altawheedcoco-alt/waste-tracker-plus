import { useState } from 'react';
import { Brain, Zap, Hand, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OperationModeSwitchProps {
  facilityId?: string | null;
  currentMode: string;
}

const modes = [
  {
    value: 'ai',
    label: 'ذكي',
    icon: Brain,
    color: 'bg-purple-500 text-white',
    inactiveColor: 'text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-950/30',
    description: 'النظام يقرر ويُنفذ تلقائياً (AI Auto-Pilot)',
  },
  {
    value: 'hybrid',
    label: 'مدمج',
    icon: Settings2,
    color: 'bg-blue-500 text-white',
    inactiveColor: 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950/30',
    description: 'النظام يقترح والموظف يعتمد (Hybrid)',
  },
  {
    value: 'auto',
    label: 'تلقائي',
    icon: Zap,
    color: 'bg-emerald-500 text-white',
    inactiveColor: 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/30',
    description: 'تدفق آلي كامل بدون ذكاء اصطناعي (Automated)',
  },
  {
    value: 'manual',
    label: 'يدوي',
    icon: Hand,
    color: 'bg-gray-500 text-white',
    inactiveColor: 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-950/30',
    description: 'تحكم بشري كامل (Manual Backup)',
  },
];

const OperationModeSwitch = ({ facilityId, currentMode }: OperationModeSwitchProps) => {
  const queryClient = useQueryClient();

  const updateModeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      if (!facilityId) return;
      const { error } = await supabase
        .from('disposal_facilities')
        .update({ operation_mode: newMode })
        .eq('id', facilityId);
      if (error) throw error;
    },
    onSuccess: (_, newMode) => {
      const modeInfo = modes.find(m => m.value === newMode);
      toast.success(`تم التبديل إلى الوضع: ${modeInfo?.label || newMode}`);
      queryClient.invalidateQueries({ queryKey: ['disposal-facility'] });
    },
  });

  const activeMode = modes.find(m => m.value === currentMode) || modes[1];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50 border">
        {modes.map((mode) => {
          const isActive = mode.value === currentMode;
          const Icon = mode.icon;
          return (
            <Tooltip key={mode.value}>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                    isActive ? mode.color : mode.inactiveColor
                  }`}
                  onClick={() => updateModeMutation.mutate(mode.value)}
                  disabled={updateModeMutation.isPending}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mode.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{mode.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default OperationModeSwitch;
