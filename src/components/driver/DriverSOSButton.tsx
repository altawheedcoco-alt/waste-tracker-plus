/**
 * نظام نداء الطوارئ الشامل للسائقين v2.0
 * - 30+ حالة طوارئ متنوعة
 * - اختيار المستلم (الجهة التابع لها / كل الجهات / جهة محددة)
 * - تسجيل صوتي مرفق
 * - إرسال تلقائي لمدير النظام + الجهة المختارة
 * - إرسال رسالة صوتية في الدردشة
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle, Phone, MapPin, Car, HeartPulse,
  Shield, Loader2, CheckCircle2, Siren, Flame, CloudRain,
  Truck, Zap, Eye, ThermometerSun, Skull, Navigation,
  ShieldAlert, Wrench, Fuel, Battery, Waves, Wind,
  Building2, Users, Lock, FileWarning, CircleAlert,
  Mic, MicOff, Square, Play, Pause, Send, Search,
  Radio, Globe, Building, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImpactRecorder } from '@/hooks/useImpactRecorder';
import { notifyAdmins, notifyOrganizationMembers } from '@/services/unifiedNotifier';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface DriverSOSButtonProps {
  driverId: string;
  organizationId?: string;
  currentShipmentId?: string;
  driverType?: 'company' | 'hired' | 'independent';
}

// ═══════════════════════════════════════
// 30+ حالة طوارئ شاملة
// ═══════════════════════════════════════
const emergencyCategories = [
  {
    category: 'حوادث ومرور',
    items: [
      { type: 'accident_minor', label: 'حادث مروري بسيط', icon: Car },
      { type: 'accident_major', label: 'حادث مروري خطير', icon: Car },
      { type: 'collision', label: 'تصادم مع مركبة أخرى', icon: Car },
      { type: 'pedestrian_hit', label: 'اصطدام بشخص', icon: Users },
      { type: 'rollover', label: 'انقلاب المركبة', icon: Truck },
      { type: 'road_blocked', label: 'طريق مسدود / حادث أمامي', icon: Navigation },
    ],
  },
  {
    category: 'أعطال فنية',
    items: [
      { type: 'breakdown_engine', label: 'عطل في المحرك', icon: Wrench },
      { type: 'breakdown_tire', label: 'انفجار إطار', icon: CircleAlert },
      { type: 'breakdown_brake', label: 'عطل في الفرامل', icon: ShieldAlert },
      { type: 'breakdown_electrical', label: 'عطل كهربائي', icon: Zap },
      { type: 'breakdown_transmission', label: 'عطل في ناقل الحركة', icon: Wrench },
      { type: 'fuel_empty', label: 'نفاذ الوقود', icon: Fuel },
      { type: 'battery_dead', label: 'بطارية فارغة', icon: Battery },
      { type: 'overheating', label: 'ارتفاع حرارة المحرك', icon: ThermometerSun },
    ],
  },
  {
    category: 'أمن وسلامة',
    items: [
      { type: 'robbery', label: 'سرقة / محاولة سرقة', icon: ShieldAlert },
      { type: 'threat', label: 'تهديد شخصي', icon: Shield },
      { type: 'harassment', label: 'تحرش أو اعتداء', icon: Users },
      { type: 'cargo_theft', label: 'سرقة الحمولة', icon: Lock },
      { type: 'suspicious_vehicle', label: 'مركبة مشبوهة تتبعني', icon: Eye },
      { type: 'checkpoint_issue', label: 'مشكلة في نقطة تفتيش', icon: Building2 },
    ],
  },
  {
    category: 'طوارئ طبية',
    items: [
      { type: 'medical_driver', label: 'حالة طبية طارئة للسائق', icon: HeartPulse },
      { type: 'medical_other', label: 'إصابة شخص آخر', icon: HeartPulse },
      { type: 'fatigue', label: 'إرهاق شديد / نعاس', icon: Eye },
      { type: 'heatstroke', label: 'ضربة شمس', icon: ThermometerSun },
    ],
  },
  {
    category: 'حمولة وبيئة',
    items: [
      { type: 'spill', label: 'انسكاب مواد خطرة', icon: Skull },
      { type: 'cargo_damage', label: 'تلف الحمولة', icon: FileWarning },
      { type: 'cargo_shift', label: 'انزلاق الحمولة', icon: AlertTriangle },
      { type: 'fire', label: 'حريق في المركبة / الحمولة', icon: Flame },
      { type: 'leak', label: 'تسريب سوائل أو غازات', icon: Waves },
    ],
  },
  {
    category: 'ظروف بيئية',
    items: [
      { type: 'flood', label: 'فيضان / غرق الطريق', icon: Waves },
      { type: 'sandstorm', label: 'عاصفة رملية', icon: Wind },
      { type: 'heavy_rain', label: 'أمطار غزيرة / انعدام رؤية', icon: CloudRain },
      { type: 'road_damage', label: 'طريق متضرر / حفر خطيرة', icon: AlertTriangle },
    ],
  },
  {
    category: 'أخرى',
    items: [
      { type: 'lost', label: 'ضياع / فقدان الاتجاه', icon: Navigation },
      { type: 'document_issue', label: 'مشكلة في الأوراق / التصاريح', icon: FileWarning },
      { type: 'other', label: 'حالة طوارئ أخرى', icon: CircleAlert },
    ],
  },
];

const allEmergencyTypes = emergencyCategories.flatMap(c => c.items);

// ═══════════════════════════════════════
// Recipients
// ═══════════════════════════════════════
type RecipientTarget = 'admin_only' | 'my_org' | 'all_orgs' | 'specific_org';

const DriverSOSButton = ({ driverId, organizationId, currentShipmentId, driverType }: DriverSOSButtonProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { recordEmergencySent } = useImpactRecorder();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([emergencyCategories[0].category]);
  const [step, setStep] = useState<'type' | 'details'>('type');

  // Recipient
  const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>(
    driverType === 'company' && organizationId ? 'my_org' : 'admin_only'
  );
  const [specificOrgId, setSpecificOrgId] = useState<string | null>(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch organizations related to shipment
  const { data: relatedOrgs } = useQuery({
    queryKey: ['sos-related-orgs', currentShipmentId, driverId],
    enabled: isOpen,
    queryFn: async () => {
      const orgs: { id: string; name: string; relation: string }[] = [];

      // Driver's own org
      if (organizationId) {
        const { data: myOrg } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('id', organizationId)
          .single();
        if (myOrg) orgs.push({ ...myOrg, relation: 'جهتي' });
      }

      // Shipment-related orgs
      if (currentShipmentId) {
        const { data: shipment } = await supabase
          .from('shipments')
          .select('generator_id, transporter_id, recycler_id')
          .eq('id', currentShipmentId)
          .single();

        if (shipment) {
          const orgIds = [shipment.generator_id, shipment.transporter_id, shipment.recycler_id]
            .filter(Boolean)
            .filter(id => id !== organizationId);

          if (orgIds.length > 0) {
            const { data: shipOrgs } = await supabase
              .from('organizations')
              .select('id, name')
              .in('id', orgIds as string[]);
            shipOrgs?.forEach(o => orgs.push({ ...o, relation: 'طرف في الشحنة' }));
          }
        }
      }

      return orgs;
    },
  });

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      toast({ title: 'لا يمكن الوصول للميكروفون', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Filter emergency types by search
  const filteredCategories = searchQuery.trim()
    ? emergencyCategories.map(c => ({
        ...c,
        items: c.items.filter(i => i.label.includes(searchQuery) || i.type.includes(searchQuery)),
      })).filter(c => c.items.length > 0)
    : emergencyCategories;

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ═══════════════════════════════════════
  // Send SOS
  // ═══════════════════════════════════════
  const handleSOS = useCallback(async () => {
    if (!selectedType) return;
    setIsSending(true);

    try {
      // 1) Get location
      let lat: number | undefined, lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch { /* proceed without */ }

      // 2) Upload voice recording if exists
      let voiceUrl: string | null = null;
      if (audioBlob && user?.id) {
        const path = `emergencies/${user.id}/${Date.now()}.webm`;
        const { error: uploadErr } = await supabase.storage.from('media').upload(path, audioBlob, { contentType: 'audio/webm' });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
          voiceUrl = urlData.publicUrl;
        }
      }

      // 3) Insert emergency record
      const effectiveOrgId = organizationId || 'system';
      const { data: emergencyRow } = await supabase.from('driver_emergencies').insert({
        driver_id: driverId,
        organization_id: effectiveOrgId,
        emergency_type: selectedType,
        description: description || null,
        latitude: lat,
        longitude: lng,
        shipment_id: currentShipmentId || null,
      }).select('id').single();

      // 4) Record impact
      if (emergencyRow) {
        recordEmergencySent(emergencyRow.id, selectedType, {
          shipmentId: currentShipmentId, lat, lng,
        });
      }

      // 5) Build notification content
      const typeLabel = allEmergencyTypes.find(e => e.type === selectedType)?.label || selectedType;
      const notifTitle = `🚨 نداء طوارئ: ${typeLabel}`;
      const notifBody = [
        description || typeLabel,
        currentShipmentId ? `الشحنة: ${currentShipmentId}` : null,
        lat ? `الموقع: ${lat.toFixed(5)}, ${lng?.toFixed(5)}` : null,
        voiceUrl ? `🎙️ تسجيل صوتي مرفق` : null,
      ].filter(Boolean).join('\n');

      // 6) Always notify admins
      await notifyAdmins(notifTitle, notifBody, {
        type: 'emergency',
        organization_id: effectiveOrgId,
        reference_id: emergencyRow?.id,
        reference_type: 'driver_emergency',
      });

      // 7) Notify based on recipient target
      if (recipientTarget === 'my_org' && organizationId) {
        await notifyOrganizationMembers(organizationId, notifTitle, notifBody, {
          type: 'emergency',
          reference_id: emergencyRow?.id,
          reference_type: 'driver_emergency',
        });
      } else if (recipientTarget === 'specific_org' && specificOrgId) {
        await notifyOrganizationMembers(specificOrgId, notifTitle, notifBody, {
          type: 'emergency',
          reference_id: emergencyRow?.id,
          reference_type: 'driver_emergency',
        });
      } else if (recipientTarget === 'all_orgs' && relatedOrgs) {
        await Promise.all(
          relatedOrgs.map(org =>
            notifyOrganizationMembers(org.id, notifTitle, notifBody, {
              type: 'emergency',
              reference_id: emergencyRow?.id,
              reference_type: 'driver_emergency',
            })
          )
        );
      }

      // 8) Send voice message to chat if recorded
      if (voiceUrl && user?.id) {
        // Determine chat recipient org
        const chatOrgId = recipientTarget === 'specific_org' ? specificOrgId
          : recipientTarget === 'my_org' ? organizationId
          : organizationId || relatedOrgs?.[0]?.id;

        if (chatOrgId) {
          // Find or create a chat room with the org
          const { data: existingRoom } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('organization_id', chatOrgId)
            .limit(1)
            .maybeSingle();

          const roomId = existingRoom?.id;
          if (roomId) {
            await supabase.from('chat_messages').insert({
              room_id: roomId,
              sender_id: user.id,
              sender_organization_id: chatOrgId,
              message_type: 'voice',
              content: `🚨 نداء طوارئ: ${typeLabel}`,
              file_url: voiceUrl,
              file_name: 'emergency_voice.webm',
              file_mime_type: 'audio/webm',
            });
          }
        }
      }

      setIsSent(true);
      toast({
        title: '🚨 تم إرسال نداء الطوارئ',
        description: 'سيتم التواصل معك في أقرب وقت',
      });

      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 3000);

    } catch (error) {
      console.error('SOS error:', error);
      toast({ title: 'خطأ في الإرسال', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  }, [selectedType, description, driverId, organizationId, currentShipmentId, toast, audioBlob, user, recipientTarget, specificOrgId, relatedOrgs]);

  const resetForm = () => {
    setIsSent(false);
    setSelectedType(null);
    setDescription('');
    setStep('type');
    setSearchQuery('');
    clearRecording();
  };

  const selectedTypeLabel = allEmergencyTypes.find(e => e.type === selectedType)?.label;
  const SelectedIcon = allEmergencyTypes.find(e => e.type === selectedType)?.icon || CircleAlert;

  return (
    <>
      {/* Floating SOS Button */}
      <motion.div className="fixed bottom-24 left-4 z-40" whileTap={{ scale: 0.9 }}>
        <Button
          size="lg"
          variant="destructive"
          className="rounded-full w-14 h-14 p-0 shadow-lg shadow-destructive/30"
          onClick={() => setIsOpen(true)}
        >
          <Siren className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* SOS Dialog */}
      <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-0" dir="rtl">
          {/* Header */}
          <DialogHeader className="p-4 pb-2 border-b border-destructive/20 bg-destructive/5">
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="w-5 h-5" />
              نداء طوارئ
            </DialogTitle>
            <DialogDescription>
              {step === 'type' ? 'اختر نوع الطوارئ' : 'أضف تفاصيل وحدد المستلم'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 px-4"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-lg">تم الإرسال بنجاح</p>
                <p className="text-sm text-muted-foreground mt-1">سيتم التواصل معك قريباً</p>
              </motion.div>
            ) : step === 'type' ? (
              <motion.div key="type-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 overflow-hidden">
                {/* Search */}
                <div className="px-4 pt-3 pb-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن نوع الطوارئ..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pr-9 text-sm"
                    />
                  </div>
                </div>

                {/* Emergency types - scrollable */}
                <ScrollArea className="flex-1 px-4 pb-4" style={{ maxHeight: '50vh' }}>
                  <div className="space-y-2">
                    {filteredCategories.map((cat) => {
                      const isExpanded = expandedCategories.includes(cat.category) || searchQuery.trim() !== '';
                      return (
                        <div key={cat.category}>
                          <button
                            onClick={() => toggleCategory(cat.category)}
                            className="w-full flex items-center justify-between py-2 px-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span>{cat.category} ({cat.items.length})</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-2 gap-2 pb-2">
                                  {cat.items.map((item) => (
                                    <button
                                      key={item.type}
                                      onClick={() => { setSelectedType(item.type); setStep('details'); }}
                                      className={cn(
                                        'p-3 rounded-xl border-2 text-center transition-all text-xs',
                                        selectedType === item.type
                                          ? 'border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/20'
                                          : 'border-border hover:border-destructive/30 hover:bg-destructive/5'
                                      )}
                                    >
                                      <item.icon className="w-6 h-6 mx-auto mb-1.5" />
                                      <p className="font-medium leading-tight">{item.label}</p>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </motion.div>
            ) : (
              <motion.div key="details-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col flex-1 overflow-hidden">
                <ScrollArea className="flex-1 px-4 py-3" style={{ maxHeight: '55vh' }}>
                  <div className="space-y-4">
                    {/* Selected type badge */}
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="gap-1.5 text-sm py-1 px-3">
                        <SelectedIcon className="w-4 h-4" />
                        {selectedTypeLabel}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setStep('type')}>
                        تغيير
                      </Button>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">وصف إضافي</label>
                      <Textarea
                        placeholder="صف الحالة بالتفصيل (اختياري)..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Voice Recording */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        🎙️ تسجيل صوتي (اختياري)
                      </label>
                      <div className="flex items-center gap-2">
                        {!audioBlob ? (
                          <Button
                            variant={isRecording ? 'destructive' : 'outline'}
                            size="sm"
                            className="gap-2 flex-1"
                            onClick={isRecording ? stopRecording : startRecording}
                          >
                            {isRecording ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current" />
                                إيقاف ({formatDuration(recordingDuration)})
                                <motion.div
                                  className="w-2 h-2 rounded-full bg-white"
                                  animate={{ opacity: [1, 0.3, 1] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                />
                              </>
                            ) : (
                              <>
                                <Mic className="w-3.5 h-3.5" />
                                سجّل رسالة صوتية
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 p-2 rounded-lg bg-muted/50 border border-border/50">
                            <audio src={audioUrl!} controls className="h-8 flex-1" style={{ maxWidth: '100%' }} />
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearRecording}>
                              <MicOff className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {audioBlob && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          سيتم إرسال التسجيل مع النداء في الدردشة
                        </p>
                      )}
                    </div>

                    {/* Recipient Selection */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        📤 إرسال النداء إلى
                      </label>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        ✅ مدير النظام سيتلقى النداء تلقائياً دائماً
                      </p>
                      <div className="space-y-1.5">
                        {/* Admin only */}
                        <label className={cn(
                          'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                          recipientTarget === 'admin_only' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                        )}>
                          <input
                            type="radio"
                            name="recipient"
                            checked={recipientTarget === 'admin_only'}
                            onChange={() => setRecipientTarget('admin_only')}
                            className="sr-only"
                          />
                          <Radio className={cn('w-4 h-4', recipientTarget === 'admin_only' ? 'text-primary' : 'text-muted-foreground')} />
                          <div className="flex-1">
                            <p className="text-xs font-medium">مدير النظام فقط</p>
                          </div>
                        </label>

                        {/* My organization */}
                        {organizationId && (
                          <label className={cn(
                            'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                            recipientTarget === 'my_org' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                          )}>
                            <input
                              type="radio"
                              name="recipient"
                              checked={recipientTarget === 'my_org'}
                              onChange={() => setRecipientTarget('my_org')}
                              className="sr-only"
                            />
                            <Building className={cn('w-4 h-4', recipientTarget === 'my_org' ? 'text-primary' : 'text-muted-foreground')} />
                            <div className="flex-1">
                              <p className="text-xs font-medium">جهتي + مدير النظام</p>
                            </div>
                          </label>
                        )}

                        {/* All related orgs */}
                        {relatedOrgs && relatedOrgs.length > 1 && (
                          <label className={cn(
                            'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                            recipientTarget === 'all_orgs' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                          )}>
                            <input
                              type="radio"
                              name="recipient"
                              checked={recipientTarget === 'all_orgs'}
                              onChange={() => setRecipientTarget('all_orgs')}
                              className="sr-only"
                            />
                            <Globe className={cn('w-4 h-4', recipientTarget === 'all_orgs' ? 'text-primary' : 'text-muted-foreground')} />
                            <div className="flex-1">
                              <p className="text-xs font-medium">كل الجهات المرتبطة ({relatedOrgs.length})</p>
                            </div>
                          </label>
                        )}

                        {/* Specific org */}
                        {relatedOrgs && relatedOrgs.length > 0 && (
                          <div>
                            <label className={cn(
                              'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                              recipientTarget === 'specific_org' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
                            )}>
                              <input
                                type="radio"
                                name="recipient"
                                checked={recipientTarget === 'specific_org'}
                                onChange={() => setRecipientTarget('specific_org')}
                                className="sr-only"
                              />
                              <Building2 className={cn('w-4 h-4', recipientTarget === 'specific_org' ? 'text-primary' : 'text-muted-foreground')} />
                              <div className="flex-1">
                                <p className="text-xs font-medium">جهة محددة</p>
                              </div>
                            </label>
                            {recipientTarget === 'specific_org' && (
                              <div className="mt-2 mr-7 space-y-1">
                                {relatedOrgs.map(org => (
                                  <button
                                    key={org.id}
                                    onClick={() => setSpecificOrgId(org.id)}
                                    className={cn(
                                      'w-full text-right p-2 rounded-lg border text-xs transition-all',
                                      specificOrgId === org.id
                                        ? 'border-primary bg-primary/10 text-primary font-medium'
                                        : 'border-border/50 hover:border-primary/30'
                                    )}
                                  >
                                    {org.name}
                                    <span className="text-muted-foreground mr-1">({org.relation})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Actions */}
                <div className="p-4 border-t border-border/50 flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    disabled={!selectedType || isSending || (recipientTarget === 'specific_org' && !specificOrgId)}
                    onClick={handleSOS}
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
                    {isSending ? 'جاري الإرسال...' : 'إرسال نداء الطوارئ'}
                  </Button>
                  <Button variant="outline" onClick={() => window.open('tel:122', '_self')}>
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DriverSOSButton;
