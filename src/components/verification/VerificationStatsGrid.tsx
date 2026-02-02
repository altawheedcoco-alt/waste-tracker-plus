import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, FileCheck, FileX, AlertTriangle } from 'lucide-react';
import { VerificationStats } from './types';

interface VerificationStatsGridProps {
  stats: VerificationStats;
  onTabChange: (tab: string) => void;
}

const VerificationStatsGrid = ({ stats, onTabChange }: VerificationStatsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card 
        className="cursor-pointer hover:border-primary/50 transition-colors" 
        onClick={() => onTabChange('all')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي المستندات</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-amber-500/50 transition-colors border-amber-500/20 bg-amber-500/5" 
        onClick={() => onTabChange('pending')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">في الانتظار</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-emerald-500/50 transition-colors border-emerald-500/20 bg-emerald-500/5" 
        onClick={() => onTabChange('verified')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <FileCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
          <p className="text-xs text-muted-foreground">موثق</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-red-500/50 transition-colors border-red-500/20 bg-red-500/5" 
        onClick={() => onTabChange('rejected')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
            <FileX className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-xs text-muted-foreground">مرفوض</p>
        </CardContent>
      </Card>
      
      <Card 
        className="cursor-pointer hover:border-blue-500/50 transition-colors border-blue-500/20 bg-blue-500/5" 
        onClick={() => onTabChange('review')}
      >
        <CardContent className="p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.requiresReview}</p>
          <p className="text-xs text-muted-foreground">يتطلب مراجعة</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationStatsGrid;
