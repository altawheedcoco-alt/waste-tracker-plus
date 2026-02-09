import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload, X, Check, Plus, FileText, CreditCard, Users, 
  AlertTriangle, Sparkles, Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { processReceiptImage } from '@/lib/imageProcessing';

export interface DelegationParty {
  id: string;
  name: string;
  nationalId: string;
  idFrontPreview: string | null;
  idBackPreview: string | null;
  idFrontEnhanced: string | null;
  idBackEnhanced: string | null;
  role: 'principal' | 'agent'; // موكل أو وكيل
}

export interface DelegationData {
  isDelegate: boolean;
  delegationType: 'power_of_attorney' | 'authorization' | null; // توكيل أو تفويض
  delegationPages: string[]; // base64 previews of pages
  delegationEnhancedPages: string[];
  parties: DelegationParty[];
}

interface DelegationSectionProps {
  delegationData: DelegationData;
  onUpdate: (data: DelegationData) => void;
}

const enhanceImage = async (imageDataUrl: string): Promise<string> => {
  try {
    const result = await processReceiptImage(imageDataUrl, {
      enhanceContrast: true, sharpen: true, denoise: true, whiteBalance: true,
    });
    return result.processed;
  } catch { return imageDataUrl; }
};

const DelegationSection = ({ delegationData, onUpdate }: DelegationSectionProps) => {
  const [expanded, setExpanded] = useState(delegationData.isDelegate);
  const [enhancingPage, setEnhancingPage] = useState(false);
  const [enhancingPartyId, setEnhancingPartyId] = useState<string | null>(null);
  const delegationInputRef = useRef<HTMLInputElement>(null);
  const partyIdRefs = useRef<Record<string, { front: HTMLInputElement | null; back: HTMLInputElement | null }>>({});

  const toggleDelegate = (val: boolean) => {
    onUpdate({ ...delegationData, isDelegate: val });
    setExpanded(val);
  };

  const handleDelegationPageUpload = async (files: FileList | null) => {
    if (!files) return;
    setEnhancingPage(true);
    const newPages: string[] = [];
    const newEnhanced: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast.error('يرجى رفع صور أو ملفات PDF فقط');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت'); continue; }
      
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      newPages.push(dataUrl);
      if (file.type.startsWith('image/')) {
        const enhanced = await enhanceImage(dataUrl);
        newEnhanced.push(enhanced);
      } else {
        newEnhanced.push(dataUrl);
      }
    }
    
    onUpdate({
      ...delegationData,
      delegationPages: [...delegationData.delegationPages, ...newPages],
      delegationEnhancedPages: [...delegationData.delegationEnhancedPages, ...newEnhanced],
    });
    setEnhancingPage(false);
  };

  const removeDelegationPage = (index: number) => {
    const pages = [...delegationData.delegationPages];
    const enhanced = [...delegationData.delegationEnhancedPages];
    pages.splice(index, 1);
    enhanced.splice(index, 1);
    onUpdate({ ...delegationData, delegationPages: pages, delegationEnhancedPages: enhanced });
  };

  const addParty = (role: 'principal' | 'agent') => {
    const newParty: DelegationParty = {
      id: `party-${Date.now()}`,
      name: '',
      nationalId: '',
      idFrontPreview: null,
      idBackPreview: null,
      idFrontEnhanced: null,
      idBackEnhanced: null,
      role,
    };
    onUpdate({ ...delegationData, parties: [...delegationData.parties, newParty] });
  };

  const updateParty = (id: string, updates: Partial<DelegationParty>) => {
    const parties = delegationData.parties.map(p => p.id === id ? { ...p, ...updates } : p);
    onUpdate({ ...delegationData, parties });
  };

  const removeParty = (id: string) => {
    onUpdate({ ...delegationData, parties: delegationData.parties.filter(p => p.id !== id) });
  };

  const handlePartyIdUpload = async (partyId: string, side: 'front' | 'back', file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار صورة صالحة'); return; }
    
    setEnhancingPartyId(partyId);
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const enhanced = await enhanceImage(dataUrl);
    
    if (side === 'front') {
      updateParty(partyId, { idFrontPreview: dataUrl, idFrontEnhanced: enhanced });
    } else {
      updateParty(partyId, { idBackPreview: dataUrl, idBackEnhanced: enhanced });
    }
    setEnhancingPartyId(null);
  };

  const principals = delegationData.parties.filter(p => p.role === 'principal');
  const agents = delegationData.parties.filter(p => p.role === 'agent');

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div
        onClick={() => toggleDelegate(!delegationData.isDelegate)}
        className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
          delegationData.isDelegate
            ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20'
            : 'border-muted-foreground/15 hover:border-muted-foreground/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            delegationData.isDelegate ? 'bg-orange-100 dark:bg-orange-900' : 'bg-muted'
          }`}>
            <Users className={`w-4 h-4 ${delegationData.isDelegate ? 'text-orange-600' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-xs font-semibold">هل أنت وكيل أو مُفوَّض؟</p>
            <p className="text-[10px] text-muted-foreground">في حال التوقيع بالنيابة عن شخص أو جهة أخرى</p>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${
          delegationData.isDelegate ? 'bg-orange-500 justify-end' : 'bg-muted-foreground/20 justify-start'
        }`}>
          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
        </div>
      </div>

      {/* Delegation Details */}
      {delegationData.isDelegate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 overflow-hidden"
        >
          {/* Delegation Type */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">نوع التمثيل القانوني</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdate({ ...delegationData, delegationType: 'power_of_attorney' })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  delegationData.delegationType === 'power_of_attorney'
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-muted-foreground/15 hover:border-muted-foreground/30'
                }`}
              >
                <FileText className={`w-5 h-5 mx-auto mb-1 ${
                  delegationData.delegationType === 'power_of_attorney' ? 'text-orange-600' : 'text-muted-foreground'
                }`} />
                <p className="text-xs font-semibold">توكيل رسمي</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">صادر من الشهر العقاري</p>
              </button>
              <button
                onClick={() => onUpdate({ ...delegationData, delegationType: 'authorization' })}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  delegationData.delegationType === 'authorization'
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-muted-foreground/15 hover:border-muted-foreground/30'
                }`}
              >
                <FileText className={`w-5 h-5 mx-auto mb-1 ${
                  delegationData.delegationType === 'authorization' ? 'text-orange-600' : 'text-muted-foreground'
                }`} />
                <p className="text-xs font-semibold">تفويض</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">تفويض رسمي من الجهة</p>
              </button>
            </div>
          </div>

          {/* Delegation Document Upload (Multi-page) */}
          {delegationData.delegationType && (
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                صور {delegationData.delegationType === 'power_of_attorney' ? 'التوكيل' : 'التفويض'}
                <span className="text-[9px] text-muted-foreground">(يمكن رفع أكثر من صفحة)</span>
              </Label>
              
              <div className="flex items-start gap-3">
                <input
                  ref={delegationInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleDelegationPageUpload(e.target.files)}
                />
                
                {/* Pages grid */}
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {delegationData.delegationEnhancedPages.map((page, idx) => (
                      <div key={idx} className="relative group">
                        <img src={page} alt={`صفحة ${idx + 1}`} className="w-20 h-28 object-cover rounded-lg border" />
                        <div className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                          ص{idx + 1}
                        </div>
                        <button
                          onClick={() => removeDelegationPage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 bg-blue-500 text-white text-[7px] px-1 rounded">
                          <Sparkles className="w-2 h-2" /> محسّنة
                        </div>
                      </div>
                    ))}
                    
                    {/* Add page button */}
                    <div
                      onClick={() => !enhancingPage && delegationInputRef.current?.click()}
                      className="w-20 h-28 border-2 border-dashed border-muted-foreground/20 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all"
                    >
                      {enhancingPage ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-muted-foreground/50" />
                          <p className="text-[8px] text-muted-foreground">إضافة صفحة</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {delegationData.delegationPages.length === 0 && (
                    <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      يجب رفع صورة واحدة على الأقل من {delegationData.delegationType === 'power_of_attorney' ? 'التوكيل' : 'التفويض'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                  يشترط أن يكون {delegationData.delegationType === 'power_of_attorney' ? 'التوكيل' : 'التفويض'} سارياً وغير منتهي الصلاحية. يرجى رفع جميع الصفحات.
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Parties - Principals (الموكلون) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {delegationData.delegationType === 'power_of_attorney' ? 'الموكِّل / الموكِّلون' : 'المُفوِّض / المُفوِّضون'}
              </Label>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => addParty('principal')}>
                <Plus className="w-3 h-3" /> إضافة
              </Button>
            </div>
            {principals.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                اضغط "إضافة" لإدخال بيانات {delegationData.delegationType === 'power_of_attorney' ? 'الموكِّل' : 'المُفوِّض'}
              </p>
            )}
            {principals.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                onUpdate={(updates) => updateParty(party.id, updates)}
                onRemove={() => removeParty(party.id)}
                onIdUpload={(side, file) => handlePartyIdUpload(party.id, side, file)}
                isEnhancing={enhancingPartyId === party.id}
                roleLabel={delegationData.delegationType === 'power_of_attorney' ? 'الموكِّل' : 'المُفوِّض'}
              />
            ))}
          </div>

          {/* Parties - Agents (الوكلاء) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {delegationData.delegationType === 'power_of_attorney' ? 'الوكيل / الوكلاء' : 'المُفوَّض إليه / إليهم'}
              </Label>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => addParty('agent')}>
                <Plus className="w-3 h-3" /> إضافة
              </Button>
            </div>
            {agents.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                اضغط "إضافة" لإدخال بيانات {delegationData.delegationType === 'power_of_attorney' ? 'الوكيل' : 'المُفوَّض إليه'}
              </p>
            )}
            {agents.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                onUpdate={(updates) => updateParty(party.id, updates)}
                onRemove={() => removeParty(party.id)}
                onIdUpload={(side, file) => handlePartyIdUpload(party.id, side, file)}
                isEnhancing={enhancingPartyId === party.id}
                roleLabel={delegationData.delegationType === 'power_of_attorney' ? 'الوكيل' : 'المُفوَّض إليه'}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Sub-component for each party's card
const PartyCard = ({ party, onUpdate, onRemove, onIdUpload, isEnhancing, roleLabel }: {
  party: DelegationParty;
  onUpdate: (updates: Partial<DelegationParty>) => void;
  onRemove: () => void;
  onIdUpload: (side: 'front' | 'back', file: File | null) => void;
  isEnhancing: boolean;
  roleLabel: string;
}) => {
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[9px]">{roleLabel}</Badge>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">الاسم الكامل</Label>
          <Input
            value={party.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="أدخل الاسم"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">الرقم القومي</Label>
          <Input
            value={party.nationalId}
            onChange={(e) => onUpdate({ nationalId: e.target.value.replace(/\D/g, '').slice(0, 14) })}
            placeholder="14 رقم"
            className="h-8 text-xs font-mono text-left"
            dir="ltr"
            maxLength={14}
          />
        </div>
      </div>

      {/* ID cards */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input ref={frontRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onIdUpload('front', e.target.files?.[0] || null)} />
          <div
            onClick={() => frontRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-all h-20 ${
              party.idFrontPreview ? 'border-green-400' : 'border-muted-foreground/20 hover:border-primary/50'
            }`}
          >
            {party.idFrontPreview ? (
              <div className="relative h-full">
                <img src={party.idFrontEnhanced || party.idFrontPreview} alt="وجه" className="w-full h-full object-cover" />
                {isEnhancing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                <div className="absolute top-0.5 left-0.5 bg-green-500 text-white text-[7px] px-1 rounded flex items-center gap-0.5">
                  <Check className="w-2 h-2" /> وجه
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <Upload className="w-4 h-4 text-muted-foreground/40" />
                <p className="text-[8px] text-muted-foreground">وجه البطاقة</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <input ref={backRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onIdUpload('back', e.target.files?.[0] || null)} />
          <div
            onClick={() => backRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-all h-20 ${
              party.idBackPreview ? 'border-green-400' : 'border-muted-foreground/20 hover:border-primary/50'
            }`}
          >
            {party.idBackPreview ? (
              <div className="relative h-full">
                <img src={party.idBackEnhanced || party.idBackPreview} alt="ظهر" className="w-full h-full object-cover" />
                {isEnhancing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                <div className="absolute top-0.5 left-0.5 bg-green-500 text-white text-[7px] px-1 rounded flex items-center gap-0.5">
                  <Check className="w-2 h-2" /> ظهر
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <Upload className="w-4 h-4 text-muted-foreground/40" />
                <p className="text-[8px] text-muted-foreground">ظهر البطاقة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelegationSection;
