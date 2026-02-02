import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gavel, CheckCircle2, XCircle } from 'lucide-react';
import { AILegalAnalysis } from './types';
import { getRiskBadge } from './verificationUtils';

interface AILegalAnalysisPanelProps {
  analysis: AILegalAnalysis;
}

const AILegalAnalysisPanel = ({ analysis }: AILegalAnalysisPanelProps) => {
  return (
    <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getRiskBadge(analysis.riskLevel)}
        </div>
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          <h4 className="font-medium">التحليل القانوني</h4>
        </div>
      </div>
      
      {/* Confidence Score */}
      <div className="flex items-center gap-4 mb-4">
        <span className={`font-bold text-2xl ${
          analysis.confidence >= 80 ? 'text-emerald-600' :
          analysis.confidence >= 60 ? 'text-amber-600' : 'text-red-600'
        }`}>
          {analysis.confidence}%
        </span>
        <div className="flex-1">
          <Progress value={analysis.confidence} className="h-3" />
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-4 bg-background/50 p-2 rounded">
        {analysis.summary}
      </p>

      {/* Legal Checks */}
      <div className="space-y-2 mb-4">
        <h5 className="text-sm font-medium">الفحوصات القانونية:</h5>
        {analysis.legalChecks.map((check, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            {check.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            )}
            <div>
              <span className="font-medium">{check.name}:</span>
              <span className="text-muted-foreground mr-1">{check.details}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="border-t pt-3">
          <h5 className="text-sm font-medium mb-2">التوصيات:</h5>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AILegalAnalysisPanel;
