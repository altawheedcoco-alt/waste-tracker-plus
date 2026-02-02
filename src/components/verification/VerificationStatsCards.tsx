import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Clock, FileCheck, FileX, AlertTriangle } from 'lucide-react';

export interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  requiresReview: number;
}

interface VerificationStatsCardsProps {
  stats: VerificationStats;
  onTabChange: (tab: string) => void;
}

const VerificationStatsCards = ({ stats, onTabChange }: VerificationStatsCardsProps) => {
  const cards = [
    {
      id: 'all',
      label: 'إجمالي المستندات',
      count: stats.total,
      icon: FileText,
      color: 'primary',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      borderClass: 'hover:border-primary/50',
      cardBg: '',
    },
    {
      id: 'pending',
      label: 'في الانتظار',
      count: stats.pending,
      icon: Clock,
      color: 'amber',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-600',
      borderClass: 'hover:border-amber-500/50 border-amber-500/20 bg-amber-500/5',
      cardBg: '',
    },
    {
      id: 'verified',
      label: 'موثق',
      count: stats.verified,
      icon: FileCheck,
      color: 'emerald',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-600',
      borderClass: 'hover:border-emerald-500/50 border-emerald-500/20 bg-emerald-500/5',
      cardBg: '',
    },
    {
      id: 'rejected',
      label: 'مرفوض',
      count: stats.rejected,
      icon: FileX,
      color: 'red',
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-600',
      borderClass: 'hover:border-red-500/50 border-red-500/20 bg-red-500/5',
      cardBg: '',
    },
    {
      id: 'review',
      label: 'يتطلب مراجعة',
      count: stats.requiresReview,
      icon: AlertTriangle,
      color: 'blue',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-600',
      borderClass: 'hover:border-blue-500/50 border-blue-500/20 bg-blue-500/5',
      cardBg: '',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Card 
            key={card.id}
            className={`cursor-pointer transition-colors ${card.borderClass}`}
            onClick={() => onTabChange(card.id)}
          >
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 rounded-full ${card.bgClass} flex items-center justify-center mx-auto mb-2`}>
                <card.icon className={`w-5 h-5 ${card.textClass}`} />
              </div>
              <p className={`text-2xl font-bold ${card.textClass}`}>{card.count}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {Math.round((stats.verified / stats.total) * 100)}% مكتمل
              </span>
              <span className="text-sm font-medium">نسبة التحقق</span>
            </div>
            <Progress value={(stats.verified / stats.total) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerificationStatsCards;
