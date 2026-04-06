/**
 * قوالب التقارير الاستشارية
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const templates = [
  { name: 'تقرير دراسة الأثر البيئي (EIA)', uses: 28, lastUsed: '2026-04-03', favorite: true },
  { name: 'تقرير التدقيق البيئي', uses: 22, lastUsed: '2026-03-25', favorite: true },
  { name: 'خطة إدارة المخلفات', uses: 15, lastUsed: '2026-03-20', favorite: false },
  { name: 'تقرير تقييم المخاطر', uses: 8, lastUsed: '2026-03-10', favorite: false },
  { name: 'تقرير الامتثال البيئي', uses: 12, lastUsed: '2026-03-18', favorite: true },
];

const ConsultantReportTemplates = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        قوالب التقارير
        <Badge variant="outline" className="mr-auto text-[9px]">{templates.length} قالب</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {templates.map((t, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded border">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs truncate">{t.name}</p>
              {t.favorite && <Star className="h-2.5 w-2.5 text-amber-500 fill-current shrink-0" />}
            </div>
            <p className="text-[10px] text-muted-foreground">استُخدم {t.uses} مرة</p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default ConsultantReportTemplates;
