import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Plus, Scale, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const WASTE_TYPES = [
  { value: 'organic', labelAr: 'عضوية', labelEn: 'Organic' },
  { value: 'plastic', labelAr: 'بلاستيك', labelEn: 'Plastic' },
  { value: 'paper', labelAr: 'ورق/كرتون', labelEn: 'Paper/Cardboard' },
  { value: 'metal', labelAr: 'معادن', labelEn: 'Metal' },
  { value: 'glass', labelAr: 'زجاج', labelEn: 'Glass' },
  { value: 'electronic', labelAr: 'إلكترونية', labelEn: 'E-Waste' },
  { value: 'hazardous', labelAr: 'خطرة', labelEn: 'Hazardous' },
  { value: 'construction', labelAr: 'مخلفات بناء', labelEn: 'Construction' },
  { value: 'medical', labelAr: 'طبية', labelEn: 'Medical' },
  { value: 'other', labelAr: 'أخرى', labelEn: 'Other' },
];

const UNITS = [
  { value: 'ton', labelAr: 'طن', labelEn: 'Ton' },
  { value: 'kg', labelAr: 'كجم', labelEn: 'Kg' },
  { value: 'cubic_meter', labelAr: 'م³', labelEn: 'm³' },
  { value: 'unit', labelAr: 'وحدة', labelEn: 'Unit' },
];

const QuickWasteLogEntry = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [wasteType, setWasteType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('ton');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutate: saveLog, isPending } = useMutation({
    mutationFn: async () => {
      if (!organization?.id || !wasteType || !quantity) throw new Error('Missing data');

      const { error } = await supabase.from('waste_items').insert({
        organization_id: organization.id,
        waste_type: wasteType,
        quantity: parseFloat(quantity),
        unit,
        notes: notes || null,
        source: 'quick_log',
        status: 'logged',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setSuccess(true);
      toast.success(isAr ? 'تم تسجيل المخلفات بنجاح' : 'Waste logged successfully');
      queryClient.invalidateQueries({ queryKey: ['waste-items'] });
      setTimeout(() => {
        setWasteType('');
        setQuantity('');
        setNotes('');
        setSuccess(false);
        setExpanded(false);
      }, 1500);
    },
    onError: () => {
      toast.error(isAr ? 'حدث خطأ أثناء التسجيل' : 'Error logging waste');
    },
  });

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full group"
      >
        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-sm bg-primary/[0.02]">
          <CardContent className="p-3 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary">
              {isAr ? 'تسجيل مخلفات سريع' : 'Quick Waste Log'}
            </span>
          </CardContent>
        </Card>
      </button>
    );
  }

  return (
    <Card className="border-primary/30 shadow-md overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setExpanded(false)} className="text-xs text-muted-foreground hover:text-foreground">
            {isAr ? 'إغلاق' : 'Close'}
          </button>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-bold">{isAr ? 'تسجيل مخلفات سريع' : 'Quick Waste Log'}</h4>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={wasteType} onValueChange={setWasteType}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={isAr ? 'نوع المخلفات' : 'Waste Type'} />
            </SelectTrigger>
            <SelectContent>
              {WASTE_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {isAr ? t.labelAr : t.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={isAr ? 'الكمية' : 'Qty'}
              className="h-9 text-xs flex-1"
              min="0"
              step="0.1"
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-9 text-xs w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map(u => (
                  <SelectItem key={u.value} value={u.value}>
                    {isAr ? u.labelAr : u.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
          className="h-9 text-xs"
        />

        <Button
          onClick={() => saveLog()}
          disabled={!wasteType || !quantity || isPending || success}
          className={cn(
            "w-full gap-2 h-9 text-sm",
            success && "bg-emerald-500 hover:bg-emerald-500"
          )}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{isAr ? 'جارٍ التسجيل...' : 'Saving...'}</>
          ) : success ? (
            <><CheckCircle2 className="w-4 h-4" />{isAr ? 'تم التسجيل ✓' : 'Saved ✓'}</>
          ) : (
            <><Trash2 className="w-4 h-4" />{isAr ? 'تسجيل' : 'Log'}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickWasteLogEntry;
