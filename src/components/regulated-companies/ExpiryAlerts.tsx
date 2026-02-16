import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  companies: any[];
}

const ExpiryAlerts = ({ companies }: Props) => {
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);

  const expired = companies.filter(c => c.license_expiry_date && new Date(c.license_expiry_date) < today);
  const expiringSoon = companies.filter(c => {
    if (!c.license_expiry_date) return false;
    const d = new Date(c.license_expiry_date);
    return d >= today && d <= in30Days;
  });

  if (expired.length === 0 && expiringSoon.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {expired.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-destructive text-sm">تراخيص منتهية ({expired.length})</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {expired.slice(0, 5).map(c => (
                  <li key={c.id}>• {c.company_name_ar || c.company_name} — {c.license_expiry_date}</li>
                ))}
                {expired.length > 5 && <li className="text-destructive">و {expired.length - 5} شركة أخرى...</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      {expiringSoon.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-yellow-700 text-sm">تنتهي خلال 30 يوم ({expiringSoon.length})</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {expiringSoon.slice(0, 5).map(c => (
                  <li key={c.id}>• {c.company_name_ar || c.company_name} — {c.license_expiry_date}</li>
                ))}
                {expiringSoon.length > 5 && <li className="text-yellow-600">و {expiringSoon.length - 5} شركة أخرى...</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExpiryAlerts;
