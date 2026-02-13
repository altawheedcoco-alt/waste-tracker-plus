import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  Target,
  XCircle,
  ThumbsUp,
  Wrench,
} from 'lucide-react';
import { SystemModule, FeatureStatus } from './types';
import { triggerAIChat } from '@/lib/aiChatBus';
import { toast } from 'sonner';

interface ModuleOverviewCardProps {
  module: SystemModule;
}

export const getStatusInfo = (status: FeatureStatus) => {
  switch (status) {
    case 'completed':
      return { icon: CheckCircle2, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'مكتمل' };
    case 'in_progress':
      return { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'قيد التطوير' };
    case 'planned':
      return { icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'مخطط' };
    case 'has_issues':
      return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'يحتاج معالجة' };
  }
};

export const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
};

export const ModuleOverviewCard = ({ module }: ModuleOverviewCardProps) => {
  const ModuleIcon = module.icon;
  const nonCompleted = module.features.filter(f => f.status !== 'completed');
  
  const handleDevelop = () => {
    const features = nonCompleted.map(f => f.name).join('، ');
    const message = `طور الميزات التالية في وحدة "${module.name}": ${features}. حسّنها لتكون جاهزة للاستخدام الفعلي.`;
    triggerAIChat(message);
    toast.success(`🚀 جارٍ تطوير: ${module.name}`);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ModuleIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{module.name}</CardTitle>
            <CardDescription className="text-xs line-clamp-1">{module.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">التقدم</span>
          <span className="font-semibold text-primary">{module.overallProgress}%</span>
        </div>
        <Progress value={module.overallProgress} className="h-2" />
        <div className="flex gap-2 mt-3 text-xs items-center">
          <Badge variant="outline" className="bg-green-500/10 text-green-700">
            {module.features.filter(f => f.status === 'completed').length} مكتمل
          </Badge>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
            {module.features.filter(f => f.status === 'in_progress').length} قيد العمل
          </Badge>
          {nonCompleted.length > 0 && (
            <Button size="sm" variant="outline" className="gap-1 text-[10px] h-6 ms-auto border-primary/30 text-primary" onClick={handleDevelop}>
              <Wrench className="w-3 h-3" />
              طوّر
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface StrengthsListProps {
  strengths: string[];
}

export const StrengthsList = ({ strengths }: StrengthsListProps) => (
  <div className="bg-green-500/5 rounded-lg p-3">
    <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
      <ThumbsUp className="w-4 h-4" />
      نقاط القوة
    </h4>
    <ul className="space-y-1">
      {strengths.map((strength, i) => (
        <li key={i} className="text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          {strength}
        </li>
      ))}
    </ul>
  </div>
);
