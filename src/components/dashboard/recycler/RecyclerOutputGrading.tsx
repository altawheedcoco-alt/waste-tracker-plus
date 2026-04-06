import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Package } from 'lucide-react';

const grades = [
  { product: 'حبيبات PET شفاف', grade: 'Premium', price: '18,500 ج.م/طن', stock: '45 طن', demand: 'عالي' },
  { product: 'حبيبات HDPE', grade: 'Standard', price: '14,200 ج.م/طن', stock: '32 طن', demand: 'متوسط' },
  { product: 'لب ورقي معاد', grade: 'Economy', price: '8,900 ج.م/طن', stock: '78 طن', demand: 'عالي' },
  { product: 'خردة حديد نظيفة', grade: 'Premium', price: '22,000 ج.م/طن', stock: '25 طن', demand: 'عالي جداً' },
  { product: 'زجاج مكسر مصنّف', grade: 'Standard', price: '6,500 ج.م/طن', stock: '18 طن', demand: 'منخفض' },
];

const gradeStyles = {
  Premium: 'text-green-600 bg-green-500/10',
  Standard: 'text-blue-600 bg-blue-500/10',
  Economy: 'text-yellow-600 bg-yellow-500/10',
};

const RecyclerOutputGrading = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Award className="h-5 w-5 text-primary" />
        تصنيف المنتجات النهائية
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {grades.map((g, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{g.product}</p>
                <p className="text-xs text-muted-foreground">مخزون: {g.stock} • طلب: {g.demand}</p>
              </div>
            </div>
            <div className="text-left">
              <span className={`text-xs px-2 py-0.5 rounded ${gradeStyles[g.grade as keyof typeof gradeStyles]}`}>
                {g.grade}
              </span>
              <p className="text-xs font-bold text-primary mt-1">{g.price}</p>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default RecyclerOutputGrading;
