import { Award, Trophy, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PrideCertificateCard from '@/components/certificates/PrideCertificateCard';
import { usePrideCertificates } from '@/hooks/usePrideCertificates';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const getOrgActionAr = (type: string) => {
  switch (type) {
    case 'generator': return 'تم توليدها';
    case 'transporter': return 'تم نقلها';
    case 'recycler': return 'تم تدويرها';
    case 'disposal': return 'تم التخلص منها';
    default: return 'تمت معالجتها';
  }
};

const PrideCertificates = () => {
  const { organization, roles } = useAuth();
  const isAdmin = roles.includes('admin');
  const orgType = organization?.organization_type as string;
  const {
    certificates,
    isLoading,
    totalTons,
    nextMilestone,
    progressToNext,
    certificateCount,
  } = usePrideCertificates();

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">شهادات الفخر والتقدير</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'جميع شهادات التقدير لكافة الجهات' : 'إنجازاتك البيئية التي نفخر بها'}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTons.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">طن {getOrgActionAr(orgType)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificateCount}</p>
                <p className="text-xs text-muted-foreground">شهادة صادرة</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{nextMilestone}</p>
                <p className="text-xs text-muted-foreground">الهدف القادم (طن)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">التقدم نحو الشهادة التالية</span>
                <span className="font-bold">{progressToNext.toFixed(0)}%</span>
              </div>
              <Progress value={progressToNext} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {(nextMilestone - totalTons).toFixed(1)} طن متبقية
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : certificates.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">🏅 شهاداتك ({certificates.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map(cert => (
                <PrideCertificateCard
                  key={cert.id}
                  certificate={cert}
                  organizationName={organization?.name}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <div>
                <h3 className="text-lg font-semibold">لم تصدر شهادات بعد</h3>
                <p className="text-muted-foreground">
                  تصدر أول شهادة فخر عند بلوغ 300 طن من المخلفات، ثم شهادة جديدة كل 100 طن إضافية
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{totalTons.toFixed(1)} طن</span>
                  <span>300 طن</span>
                </div>
                <Progress value={(totalTons / 300) * 100} className="h-4" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Milestone Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🗺️ خارطة الإنجازات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000].map(milestone => {
                const achieved = totalTons >= milestone;
                const isCurrent = !achieved && totalTons < milestone && (milestone === 300 || totalTons >= milestone - 100);
                return (
                  <div
                    key={milestone}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all min-w-[80px] ${
                      achieved
                        ? 'border-primary bg-primary/10'
                        : isCurrent
                        ? 'border-dashed border-primary/50 bg-primary/5 animate-pulse'
                        : 'border-muted bg-muted/30'
                    }`}
                  >
                    <span className="text-lg">
                      {achieved ? '🏅' : isCurrent ? '🎯' : '🔒'}
                    </span>
                    <span className={`text-sm font-bold ${achieved ? 'text-primary' : 'text-muted-foreground'}`}>
                      {milestone >= 1000 ? `${milestone / 1000}K` : milestone}
                    </span>
                    <span className="text-[10px] text-muted-foreground">طن</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PrideCertificates;
