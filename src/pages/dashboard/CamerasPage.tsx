import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/ui/back-button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Video, Upload, Shield, ShieldCheck, Loader2, CheckCircle2, XCircle, AlertTriangle, Eye, ArrowRight, Film, Play, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CameraAccessGrantsManager from '@/components/cameras/CameraAccessGrantsManager';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const VIDEO_TYPE_LABELS: Record<string, string> = {
  live_recording: 'تسجيل مباشر',
  upload: 'رفع ملف',
  live_stream: 'بث مباشر',
};

const CamerasPage = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoSource, setVideoSource] = useState<'live' | 'upload'>('live');

  const orgType = organization?.organization_type;

  // Fetch active shipments for this organization
  const { data: activeShipments = [] } = useQuery({
    queryKey: ['active-shipments-for-camera', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const query: any = supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, status, generator_organization_id, transporter_organization_id, recycler_organization_id')
        .in('status', ['new', 'approved', 'confirmed', 'collecting', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (orgType === 'generator') {
        query.eq('generator_organization_id', organization.id);
      } else if (orgType === 'transporter') {
        query.eq('transporter_organization_id', organization.id);
      } else if (orgType === 'recycler' || orgType === 'disposal') {
        query.eq('recycler_organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch camera events for this org
  const { data: cameraEvents = [] } = useQuery({
    queryKey: ['camera-events-page', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('camera_arrival_events')
        .select('*')
        .eq('facility_organization_id', organization.id)
        .order('captured_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch all saved videos with shipment info
  const { data: savedVideos = [], isLoading: videosLoading } = useQuery({
    queryKey: ['shipment-videos-archive', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('shipment_videos')
        .select(`
          *,
          shipment:shipments(id, shipment_number, waste_type, status, pickup_location, delivery_location, generator_organization_id, transporter_organization_id, recycler_organization_id),
          uploader:profiles!shipment_videos_uploaded_by_fkey(full_name)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        // Fallback without join if fkey not recognized
        const { data: fallback, error: fbErr } = await supabase
          .from('shipment_videos')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(50);
        if (fbErr) throw fbErr;
        return fallback || [];
      }
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setVerificationResult(null);
      setVideoSource('live');
    } catch (err) {
      toast.error('فشل في فتح الكاميرا. يرجى السماح بالوصول إلى الكاميرا.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8' });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setVerificationResult(null);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    stopCamera();
  }, [stopCamera]);

  // Upload video, save to shipment_videos table, and verify with AI
  const uploadAndVerify = useMutation({
    mutationFn: async () => {
      if (!recordedBlob || !selectedShipmentId || !organization?.id || !user?.id) {
        throw new Error('يرجى تسجيل فيديو واختيار شحنة');
      }

      setIsVerifying(true);

      // 1. Upload to storage
      const ext = videoSource === 'upload' ? 'mp4' : 'webm';
      const contentType = videoSource === 'upload' ? 'video/mp4' : 'video/webm';
      const fileName = `${organization.id}/${selectedShipmentId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('shipment-videos')
        .upload(fileName, recordedBlob, { contentType });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('shipment-videos')
        .getPublicUrl(fileName);

      // 2. Save to shipment_videos table
      const { error: insertError } = await supabase.from('shipment_videos').insert({
        organization_id: organization.id,
        shipment_id: selectedShipmentId,
        uploaded_by: user.id,
        video_url: urlData.publicUrl,
        video_type: videoSource === 'live' ? 'live_recording' : 'upload',
        file_size_bytes: recordedBlob.size,
      });
      if (insertError) console.error('Failed to save video record:', insertError);

      // 3. Call AI verification edge function
      const { data, error } = await supabase.functions.invoke('verify-shipment-video', {
        body: {
          shipment_id: selectedShipmentId,
          video_url: urlData.publicUrl,
          organization_id: organization.id,
          uploaded_by: user.id,
        },
      });
      if (error) throw error;

      // 4. Update video record with AI result
      if (data) {
        await supabase.from('shipment_videos').update({
          ai_verified: data.is_authentic || false,
          ai_confidence_score: data.confidence_score || 0,
          ai_result: data,
        }).eq('video_url', urlData.publicUrl);
      }

      return data;
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      queryClient.invalidateQueries({ queryKey: ['camera-events-page'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-videos-archive'] });
      if (data?.is_authentic) {
        toast.success('✅ تم التحقق: الفيديو حقيقي والشحنة موجودة');
      } else {
        toast.warning('⚠️ لم يتم التحقق بالكامل. راجع التفاصيل.');
      }
      setIsVerifying(false);
    },
    onError: (err: any) => {
      toast.error('فشل في رفع أو تحليل الفيديو');
      setIsVerifying(false);
    },
  });

  // Handle file upload (existing video)
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('حجم الفيديو يجب أن لا يتجاوز 50 ميغابايت');
      return;
    }
    setRecordedBlob(file);
    setRecordedUrl(URL.createObjectURL(file));
    setVerificationResult(null);
    setVideoSource('upload');
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <Camera className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-xl font-bold">نظام الكاميرات والتحقق المباشر</h1>
          <p className="text-sm text-muted-foreground">تسجيل فيديو مباشر، رفع فيديو، تحقق بالذكاء الاصطناعي، وإدارة تصاريح الكاميرات</p>
        </div>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live" className="gap-1.5">
            <Video className="w-4 h-4" />
            تسجيل مباشر
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-1.5">
            <Film className="w-4 h-4" />
            أرشيف الفيديوهات
          </TabsTrigger>
          <TabsTrigger value="grants" className="gap-1.5">
            <Shield className="w-4 h-4" />
            تصاريح الوصول
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5">
            <Eye className="w-4 h-4" />
            سجل الأحداث
          </TabsTrigger>
        </TabsList>

        {/* ═══ Tab 1: Live Recording ═══ */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                تسجيل فيديو مباشر من الموقع
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                افتح الكاميرا وسجّل فيديو حي من الموقع لتوثيق وصول الشحنة. سيقوم الذكاء الاصطناعي بالتحقق من حقيقية الفيديو.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Shipment selector */}
              <div>
                <label className="text-sm font-medium mb-1 block">اختر الشحنة</label>
                <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر شحنة لتوثيقها..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeShipments.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.shipment_number || s.id.slice(0, 8)} — {s.waste_type || 'نفايات'}
                      </SelectItem>
                    ))}
                    {activeShipments.length === 0 && (
                      <div className="text-xs text-muted-foreground p-3 text-center">لا توجد شحنات نشطة</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Camera view */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!cameraActive && !recordedUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-16 h-16 mb-2 opacity-30" />
                    <p className="text-sm">اضغط &quot;فتح الكاميرا&quot; للبدء</p>
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-xs text-white bg-black/60 px-2 py-0.5 rounded-full">جاري التسجيل...</span>
                  </div>
                )}
              </div>

              {/* Recorded preview */}
              {recordedUrl && !cameraActive && (
                <div className="rounded-xl overflow-hidden bg-black aspect-video border border-border">
                  <video src={recordedUrl} className="w-full h-full object-cover" controls />
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2 flex-wrap">
                {!cameraActive && !isRecording && (
                  <>
                    <Button onClick={startCamera} variant="outline" className="gap-2">
                      <Camera className="w-4 h-4" />
                      فتح الكاميرا
                    </Button>
                    <label>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button variant="outline" className="gap-2" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                          رفع فيديو
                        </span>
                      </Button>
                    </label>
                  </>
                )}
                {cameraActive && !isRecording && (
                  <>
                    <Button onClick={startRecording} variant="destructive" className="gap-2">
                      <Video className="w-4 h-4" />
                      بدء التسجيل
                    </Button>
                    <Button onClick={stopCamera} variant="outline">إلغاء</Button>
                  </>
                )}
                {isRecording && (
                  <Button onClick={stopRecording} variant="destructive" className="gap-2">
                    <span className="w-3 h-3 rounded bg-white" />
                    إيقاف التسجيل
                  </Button>
                )}
                {recordedBlob && !isRecording && !cameraActive && (
                  <Button
                    onClick={() => uploadAndVerify.mutate()}
                    disabled={!selectedShipmentId || isVerifying}
                    className="gap-2"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    رفع وتحقق بالذكاء الاصطناعي
                  </Button>
                )}
              </div>

              {/* Verification result */}
              {verificationResult && (
                <Card className={`border-2 ${verificationResult.is_authentic ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {verificationResult.is_authentic ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      )}
                      <span className="font-semibold text-lg">
                        {verificationResult.is_authentic ? 'فيديو حقيقي ✅' : 'تحذير: لم يتم التحقق بالكامل ⚠️'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p><strong>درجة الثقة:</strong> {verificationResult.confidence_score}%</p>
                      <p><strong>التحليل:</strong> {verificationResult.analysis_summary}</p>
                      {verificationResult.checks && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {Object.entries(verificationResult.checks).map(([key, val]: any) => (
                            <div key={key} className="flex items-center gap-1.5 text-xs">
                              {val ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
                              <span>{key}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Tab 2: Video Archive ═══ */}
        <TabsContent value="archive">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" />
                أرشيف الفيديوهات
                <Badge variant="outline" className="mr-auto text-[10px]">
                  {savedVideos.length} فيديو
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                جميع الفيديوهات المسجلة أو المرفوعة مرتبطة بالشحنات وبيانات التحقق
              </p>
            </CardHeader>
            <CardContent>
              {videosLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin ml-2" />
                  <span className="text-sm">جاري التحميل...</span>
                </div>
              ) : savedVideos.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Film className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد فيديوهات محفوظة بعد</p>
                  <p className="text-xs mt-1">سجّل أو ارفع فيديو من تبويب &quot;تسجيل مباشر&quot; لتوثيق الشحنات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedVideos.map((vid: any) => {
                    const shipment = vid.shipment;
                    return (
                      <div key={vid.id} className="rounded-lg border bg-card overflow-hidden">
                        <div className="flex gap-3 p-3">
                          {/* Video thumbnail / play */}
                          <div className="w-32 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative group cursor-pointer"
                            onClick={() => window.open(vid.video_url, '_blank')}
                          >
                            <video
                              src={vid.video_url}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">
                                {VIDEO_TYPE_LABELS[vid.video_type] || vid.video_type}
                              </Badge>
                              {vid.ai_verified !== null && (
                                <Badge
                                  variant={vid.ai_verified ? 'default' : 'secondary'}
                                  className={`text-[10px] ${vid.ai_verified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : ''}`}
                                >
                                  {vid.ai_verified ? `✓ موثق ${vid.ai_confidence_score ? `(${vid.ai_confidence_score}%)` : ''}` : 'غير موثق'}
                                </Badge>
                              )}
                              {vid.file_size_bytes && (
                                <span className="text-[10px] text-muted-foreground">
                                  {(vid.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>

                            {/* Shipment info */}
                            {shipment ? (
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p className="font-medium text-foreground">
                                  شحنة: {shipment.shipment_number || shipment.id?.slice(0, 8)}
                                </p>
                                <p>النوع: {shipment.waste_type || '—'} · الحالة: {shipment.status || '—'}</p>
                                {(shipment.pickup_location || shipment.delivery_location) && (
                                  <p className="truncate">
                                    {shipment.pickup_location && `من: ${shipment.pickup_location}`}
                                    {shipment.delivery_location && ` → إلى: ${shipment.delivery_location}`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">شحنة: {vid.shipment_id?.slice(0, 8) || '—'}</p>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span>
                                {format(new Date(vid.created_at), 'dd MMM yyyy — HH:mm', { locale: ar })}
                              </span>
                              {vid.uploader?.full_name && (
                                <span>بواسطة: {vid.uploader.full_name}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => window.open(vid.video_url, '_blank')}
                              title="فتح الفيديو"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* AI Result summary if available */}
                        {vid.ai_result && (
                          <div className={`px-3 py-2 text-xs border-t ${vid.ai_verified ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                            <span className="font-medium">
                              {vid.ai_verified ? '✅ ' : '⚠️ '}
                              تحليل AI:
                            </span>{' '}
                            {vid.ai_result.analysis_summary || 'لا توجد تفاصيل'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ Tab 3: Access Grants ═══ */}
        <TabsContent value="grants">
          <CameraAccessGrantsManager />
        </TabsContent>

        {/* ═══ Tab 4: Camera Events Log ═══ */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                سجل أحداث الكاميرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cameraEvents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد أحداث كاميرا مسجلة بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cameraEvents.map((ev: any) => (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <Camera className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">لوحة: {ev.plate_number || '—'}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {ev.captured_at ? format(new Date(ev.captured_at), 'dd MMM yyyy — HH:mm', { locale: ar }) : '—'}
                        </p>
                      </div>
                      <Badge variant={ev.match_status === 'matched' ? 'default' : 'secondary'} className="text-[10px]">
                        {ev.match_status === 'matched' ? 'مطابق' : ev.match_status || 'غير محدد'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CamerasPage;
