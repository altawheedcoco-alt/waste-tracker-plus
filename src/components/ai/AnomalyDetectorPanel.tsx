import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAnomalyDetector } from '@/hooks/useAnomalyDetector';

const AnomalyDetectorPanel = () => {
  const { isAnalyzing, result, error, analyzeShipments, clearResults } = useAnomalyDetector();
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'weight' | 'route' | 'price'>('comprehensive');

  // بيانات تجريبية للعرض
  const mockShipments = [
    { id: 'SHP001', weight: 2500, expectedWeight: 2000, origin: 'الرياض', destination: 'جدة', timestamp: new Date().toISOString(), price: 1500, distance: 950 },
    { id: 'SHP002', weight: 1800, expectedWeight: 1750, origin: 'الدمام', destination: 'المدينة', timestamp: new Date().toISOString(), price: 2200, distance: 1200 },
    { id: 'SHP003', weight: 3200, expectedWeight: 3000, origin: 'مكة', destination: 'الطائف', timestamp: new Date().toISOString(), price: 500, distance: 80 },
    { id: 'SHP004', weight: 500, expectedWeight: 2500, origin: 'الخبر', destination: 'الأحساء', timestamp: new Date().toISOString(), price: 8000, distance: 150 },
    { id: 'SHP005', weight: 4000, expectedWeight: 4100, origin: 'القصيم', destination: 'حائل', timestamp: new Date().toISOString(), price: 1800, distance: 300 },
  ];

  const handleAnalyze = () => {
    analyzeShipments(mockShipments, analysisType);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getAnomalyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'weight_discrepancy': 'فرق في الوزن',
      'route_anomaly': 'شذوذ في المسار',
      'price_anomaly': 'شذوذ في السعر',
      'suspicious_pattern': 'نمط مشبوه',
      'data_tampering': 'تلاعب بالبيانات'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">كشف الشذوذ والاحتيال</CardTitle>
                <p className="text-sm text-muted-foreground">
                  تحليل الشحنات للكشف عن الأنماط غير الطبيعية
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="comprehensive">تحليل شامل</option>
                <option value="weight">تحليل الأوزان</option>
                <option value="route">تحليل المسارات</option>
                <option value="price">تحليل الأسعار</option>
              </select>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin ml-2" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 ml-2" />
                    بدء التحليل
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {isAnalyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <>
          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ملخص التحليل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{result.summary?.totalAnalyzed || 0}</div>
                    <div className="text-sm text-muted-foreground">شحنات محللة</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-red-500">{result.summary?.totalAnomalies || 0}</div>
                    <div className="text-sm text-muted-foreground">شذوذ مكتشف</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-orange-500">{result.summary?.criticalCount || 0}</div>
                    <div className="text-sm text-muted-foreground">حرج</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{result.summary?.riskScore || 0}%</div>
                    <div className="text-sm text-muted-foreground">درجة المخاطر</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>مستوى المخاطر</span>
                    <span>{result.summary?.riskScore || 0}%</span>
                  </div>
                  <Progress value={result.summary?.riskScore || 0} className="h-2" />
                </div>
                
                {result.summary?.overallAssessment && (
                  <p className="mt-4 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                    {result.summary.overallAssessment}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Anomalies List */}
          {result.anomalies && result.anomalies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">الشذوذات المكتشفة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.anomalies.map((anomaly, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(anomaly.severity)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{anomaly.shipmentId}</span>
                              <Badge variant="outline" className="text-xs">
                                {getAnomalyTypeLabel(anomaly.anomalyType)}
                              </Badge>
                            </div>
                            <p className="text-sm">{anomaly.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 {anomaly.recommendation}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            ثقة: {anomaly.confidence}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">التوصيات العامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">ابدأ التحليل</h3>
            <p className="text-sm text-muted-foreground mb-4">
              اضغط على "بدء التحليل" للكشف عن أي شذوذ في الشحنات
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-red-500">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnomalyDetectorPanel;
