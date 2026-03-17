import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  FileText, Shield, Scale, CheckCircle, AlertTriangle, Loader2,
  Factory, Truck, Recycle, Upload, CreditCard, User, Phone,
  Briefcase, PenTool, ChevronLeft, ChevronRight, Lock, Camera,
  Check, ScanLine, Sparkles, Eye, UserCheck, ImagePlus, FlipHorizontal
} from 'lucide-react';
import IDCardScanner from '@/components/id-scanner/IDCardScanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTermsSections, getTermsTitle, getOrganizationTypeLabel,
  getAgreementText, legalReferences, CURRENT_TERMS_VERSION, OrganizationType
} from '@/data/organizationTermsContent';
import { useTermsContent } from '@/hooks/useTermsContent';
import SignaturePad, { SignaturePadRef } from '@/components/signature/SignaturePad';
import { useIDVerification, type ExtractedIDData } from '@/hooks/useIDVerification';
import { processReceiptImage } from '@/lib/imageProcessing';
import DelegationSection, { type DelegationData } from '@/components/auth/DelegationSection';
import BusinessDocumentSection, { type BusinessDocumentData } from '@/components/auth/BusinessDocumentSection';

interface OrganizationTermsDialogProps {
  open: boolean;
  onAccept: () => void;
  organizationType: OrganizationType;
}

type Step = 'identity' | 'selfie' | 'terms';
type IDInputMode = 'scanner' | 'upload';

const OrganizationTermsDialog = ({ open, onAccept, organizationType }: OrganizationTermsDialogProps) => {
  const { user, profile, organization } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('identity');
  
  const { data: dbTermsContent, isLoading: isLoadingTerms } = useTermsContent(organizationType);
  const { isVerifying, frontResult, backResult, faceMatchResult, mergedData, verifyDocument, verifyFaceMatch, reset: resetVerification } = useIDVerification();
  
  const [nationalId, setNationalId] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [signerPosition, setSignerPosition] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [signerDob, setSignerDob] = useState('');
  const [signerGender, setSignerGender] = useState('');
  const [signerReligion, setSignerReligion] = useState('');
  const [signerMaritalStatus, setSignerMaritalStatus] = useState('');
  const [signerGovernorate, setSignerGovernorate] = useState('');
  const [signerIdExpiry, setSignerIdExpiry] = useState('');
  
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [idFrontEnhanced, setIdFrontEnhanced] = useState<string | null>(null);
  const [idBackEnhanced, setIdBackEnhanced] = useState<string | null>(null);
  const [enhancingFront, setEnhancingFront] = useState(false);
  const [enhancingBack, setEnhancingBack] = useState(false);
  const [verifyingFront, setVerifyingFront] = useState(false);
  const [verifyingBack, setVerifyingBack] = useState(false);
  
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [verifyingFace, setVerifyingFace] = useState(false);
  const selfieVideoRef = useRef<HTMLVideoElement>(null);
  const selfieCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const [uploadingImages, setUploadingImages] = useState(false);
  const [idInputMode, setIdInputMode] = useState<IDInputMode>('scanner');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [uploadedSignaturePreview, setUploadedSignaturePreview] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'electronic' | 'upload'>('electronic');
  const [delegationData, setDelegationData] = useState<DelegationData>({
    isDelegate: false,
    delegationType: null,
    delegationPages: [],
    delegationEnhancedPages: [],
    parties: [],
  });
  const [businessDocData, setBusinessDocData] = useState<BusinessDocumentData>({
    documentType: '',
    pages: [],
    enhancedPages: [],
    fileTypes: [],
  });
  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const signatureUploadRef = useRef<HTMLInputElement>(null);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const termsSections = useMemo(() => {
    if (dbTermsContent?.sections?.length) return dbTermsContent.sections;
    return getTermsSections(organizationType);
  }, [dbTermsContent, organizationType]);

  const currentTermsVersion = dbTermsContent?.version || CURRENT_TERMS_VERSION;
  const termsTitle = getTermsTitle(organizationType);
  const agreementText = getAgreementText(organizationType);

  const getOrgIcon = () => {
    switch (organizationType) {
      case 'generator': return <Factory className="w-6 h-6" />;
      case 'transporter': return <Truck className="w-6 h-6" />;
      case 'recycler': return <Recycle className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getOrgColor = () => {
    switch (organizationType) {
      case 'generator': return 'from-blue-600 to-indigo-700';
      case 'transporter': return 'from-amber-600 to-orange-700';
      case 'recycler': return 'from-emerald-600 to-green-700';
      default: return 'from-primary to-primary/80';
    }
  };

  const getWarningText = () => {
    switch (organizationType) {
      case 'generator': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن تصنيف وتخزين المخلفات.';
      case 'transporter': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن عمليات نقل المخلفات.';
      case 'recycler': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن عمليات التدوير والمعالجة.';
      default: return 'بالموافقة، تقر بالتزامك الكامل بالقوانين البيئية المصرية.';
    }
  };

  // Enhanced image processing (CamScanner-like)
  const enhanceImage = async (imageDataUrl: string): Promise<string> => {
    try {
      const result = await processReceiptImage(imageDataUrl, {
        enhanceContrast: true,
        sharpen: true,
        denoise: true,
        whiteBalance: true,
        binarize: false,
        edgeDetection: false,
      });
      return result.processed;
    } catch {
      return imageDataUrl;
    }
  };

  const handleFileChange = async (type: 'front' | 'back', file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار ملف صورة صالح'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('حجم الملف يجب أن يكون أقل من 10 ميجابايت'); return; }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      
      if (type === 'front') {
        setIdFrontFile(file);
        setIdFrontPreview(dataUrl);
        setEnhancingFront(true);
        
        // Enhance image
        const enhanced = await enhanceImage(dataUrl);
        setIdFrontEnhanced(enhanced);
        setEnhancingFront(false);
        
        // Verify with AI
        setVerifyingFront(true);
        const result = await verifyDocument(enhanced, 'front');
        setVerifyingFront(false);
        
        if (result?.extracted_data) {
          autoFillFromExtraction(result.extracted_data);
        }
      } else {
        setIdBackFile(file);
        setIdBackPreview(dataUrl);
        setEnhancingBack(true);
        
        const enhanced = await enhanceImage(dataUrl);
        setIdBackEnhanced(enhanced);
        setEnhancingBack(false);
        
        setVerifyingBack(true);
        const result = await verifyDocument(enhanced, 'back');
        setVerifyingBack(false);
        
        if (result?.extracted_data) {
          autoFillFromExtraction(result.extracted_data);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const autoFillFromExtraction = (data: ExtractedIDData) => {
    if (data.national_id && data.national_id.length === 14) setNationalId(data.national_id);
    if (data.full_name_ar) setSignerName(data.full_name_ar);
    if (data.address) setSignerAddress(data.address);
    if (data.date_of_birth) setSignerDob(data.date_of_birth);
    if (data.gender) setSignerGender(data.gender);
    if (data.religion) setSignerReligion(data.religion);
    if (data.marital_status) setSignerMaritalStatus(data.marital_status);
    if (data.governorate) setSignerGovernorate(data.governorate);
    if (data.expiry_date) setSignerIdExpiry(data.expiry_date);
    if (data.job_title) setSignerPosition(prev => prev || data.job_title!);
  };

  const validateNationalId = (id: string) => /^\d{14}$/.test(id);

  // Handle scanner capture
  const handleScannerCapture = async (imageDataUrl: string, side: 'front' | 'back') => {
    // Convert dataUrl to File
    const blob = await fetch(imageDataUrl).then(r => r.blob());
    const file = new File([blob], `id-${side}.jpg`, { type: 'image/jpeg' });

    if (side === 'front') {
      setIdFrontFile(file);
      setIdFrontPreview(imageDataUrl);
      setIdFrontEnhanced(imageDataUrl); // Already enhanced by scanner
      setVerifyingFront(true);
      const result = await verifyDocument(imageDataUrl, 'front');
      setVerifyingFront(false);
      if (result?.extracted_data) autoFillFromExtraction(result.extracted_data);
    } else {
      setIdBackFile(file);
      setIdBackPreview(imageDataUrl);
      setIdBackEnhanced(imageDataUrl);
      setVerifyingBack(true);
      const result = await verifyDocument(imageDataUrl, 'back');
      setVerifyingBack(false);
      if (result?.extracted_data) autoFillFromExtraction(result.extracted_data);
    }
  };

  // Camera for selfie
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      if (selfieVideoRef.current) {
        selfieVideoRef.current.srcObject = stream;
        selfieVideoRef.current.play();
      }
      setCameraStream(stream);
      setCameraActive(true);
    } catch {
      toast.error('لا يمكن الوصول إلى الكاميرا. يرجى السماح بالوصول أو رفع صورة بدلاً من ذلك.');
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  }, [cameraStream]);

  const captureSelfie = () => {
    if (!selfieVideoRef.current || !selfieCanvasRef.current) return;
    const video = selfieVideoRef.current;
    const canvas = selfieCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelfiePreview(dataUrl);
    
    // Convert to file
    canvas.toBlob(blob => {
      if (blob) setSelfieFile(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
    
    stopCamera();
  };

  const handleSelfieUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار صورة صالحة'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelfiePreview(reader.result as string);
      setSelfieFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار صورة صالحة للتوقيع'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const enhanced = await enhanceImage(dataUrl);
      setUploadedSignaturePreview(enhanced);
      setSignatureDataUrl(enhanced);
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyFace = async () => {
    if (!idFrontPreview || !selfiePreview) return;
    setVerifyingFace(true);
    await verifyFaceMatch(idFrontEnhanced || idFrontPreview, selfiePreview);
    setVerifyingFace(false);
  };

  const handleProceedToSelfie = () => {
    if (!nationalId.trim()) { toast.error('يرجى إدخال الرقم القومي'); return; }
    if (!validateNationalId(nationalId)) { toast.error('الرقم القومي يجب أن يتكون من 14 رقم'); return; }
    if (!signerPhone.trim()) { toast.error('يرجى إدخال رقم الهاتف'); return; }
    if (!signerPosition.trim()) { toast.error('يرجى إدخال المسمى الوظيفي'); return; }
    if (!idFrontFile) { toast.error('يرجى رفع صورة وجه البطاقة'); return; }
    if (!idBackFile) { toast.error('يرجى رفع صورة ظهر البطاقة'); return; }
    if (!frontResult?.is_valid_document) { toast.error('لم يتم التحقق من وجه البطاقة بعد'); return; }
    if (!businessDocData.documentType) { toast.error('يرجى تحديد نوع المستند التجاري'); return; }
    if (businessDocData.pages.length === 0) { toast.error('يرجى رفع صورة أو ملف المستند التجاري (بطاقة ضريبية / سجل تجاري / وثيقة بيانات)'); return; }
    setStep('selfie');
  };

  const handleProceedToTerms = () => {
    if (!selfiePreview) { toast.error('يرجى التقاط صورة شخصية'); return; }
    if (!faceMatchResult?.faces_match) { toast.error('يرجى التحقق من تطابق الوجه أولاً'); return; }
    setStep('terms');
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('id-cards').upload(fileName, file, { upsert: true });
    if (uploadError) { console.error('Upload error:', uploadError); return null; }
    const { data: { publicUrl } } = supabase.storage.from('id-cards').getPublicUrl(fileName);
    return publicUrl;
  };

  const uploadDataUrl = async (dataUrl: string, path: string): Promise<string | null> => {
    try {
      const blob = await fetch(dataUrl).then(r => r.blob());
      const file = new File([blob], `${path}.jpg`, { type: 'image/jpeg' });
      return uploadImage(file, path);
    } catch { return null; }
  };

  const handleAcceptTerms = async () => {
    if (!agreed) { toast.error('يجب الموافقة على الشروط والأحكام للمتابعة'); return; }
    if (!signatureDataUrl && signatureMode === 'electronic' && signaturePadRef.current?.isEmpty()) { toast.error('يرجى التوقيع'); return; }
    if (!signatureDataUrl) { toast.error('يرجى التوقيع أو رفع صورة التوقيع'); return; }
    if (!user || !profile || !organization) { toast.error('حدث خطأ في بيانات المستخدم'); return; }

    // Validate delegation if enabled
    if (delegationData.isDelegate) {
      if (!delegationData.delegationType) { toast.error('يرجى تحديد نوع التمثيل القانوني'); return; }
      if (delegationData.delegationPages.length === 0) { toast.error('يرجى رفع صور التوكيل أو التفويض'); return; }
      if (delegationData.parties.length === 0) { toast.error('يرجى إضافة بيانات الأطراف'); return; }
      const incompleteParty = delegationData.parties.find(p => !p.name || !p.nationalId || !p.idFrontPreview || !p.idBackPreview);
      if (incompleteParty) { toast.error(`يرجى استكمال بيانات وصور بطاقة "${incompleteParty.name || 'أحد الأطراف'}"`); return; }
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      const timestamp = Date.now();
      const basePath = `${organization.id}/${user.id}`;
      
      const frontToUpload = idFrontEnhanced || idFrontPreview!;
      const backToUpload = idBackEnhanced || idBackPreview!;
      
      const [idFrontUrl, idBackUrl, selfieUrl, signatureUrl] = await Promise.all([
        uploadDataUrl(frontToUpload, `${basePath}/id-front-${timestamp}`),
        uploadDataUrl(backToUpload, `${basePath}/id-back-${timestamp}`),
        selfiePreview ? uploadDataUrl(selfiePreview, `${basePath}/selfie-${timestamp}`) : Promise.resolve(null),
        signatureDataUrl ? uploadDataUrl(signatureDataUrl, `${basePath}/signature-${timestamp}`) : Promise.resolve(null),
      ]);
      
      if (!idFrontUrl || !idBackUrl) throw new Error('فشل في رفع صور البطاقة');

      // Upload business documents
      let businessDocUrls: string[] = [];
      if (businessDocData.pages.length > 0) {
        businessDocUrls = await Promise.all(
          businessDocData.enhancedPages.map((page, i) =>
            uploadDataUrl(page, `${basePath}/business-doc-${businessDocData.documentType}-page-${i + 1}-${timestamp}`)
          )
        ).then(urls => urls.filter(Boolean) as string[]);
      }

      // Archive business documents to entity_documents for sync
      if (businessDocUrls.length > 0 && organization.id) {
        const docTypeLabel = DOCUMENT_TYPES_MAP[businessDocData.documentType] || businessDocData.documentType;
        const archivePromises = businessDocUrls.map((url, i) =>
          supabase.from('entity_documents').insert({
            organization_id: organization.id,
            uploaded_by: user.id,
            title: `${docTypeLabel} - صفحة ${i + 1}`,
            file_url: url,
            document_type: businessDocData.documentType === 'tax_card' ? 'license'
              : businessDocData.documentType === 'commercial_register' ? 'license'
              : 'certificate',
            status: 'active',
            tags: [businessDocData.documentType, 'onboarding', 'business_doc'],
            metadata: {
              source: 'terms_acceptance',
              extracted_data: businessDocData.extractedData || {},
              page_number: i + 1,
              total_pages: businessDocUrls.length,
              document_category: businessDocData.documentType,
            },
          } as any)
        );
        await Promise.allSettled(archivePromises);
      }

      // Upload delegation documents if applicable
      let delegationUrls: string[] = [];
      let partyDocUrls: { partyName: string; role: string; front: string | null; back: string | null }[] = [];
      
      if (delegationData.isDelegate) {
        // Upload delegation pages
        delegationUrls = await Promise.all(
          delegationData.delegationEnhancedPages.map((page, i) =>
            uploadDataUrl(page, `${basePath}/delegation-page-${i + 1}-${timestamp}`)
          )
        ).then(urls => urls.filter(Boolean) as string[]);

        // Upload party ID cards
        partyDocUrls = await Promise.all(
          delegationData.parties.map(async (party) => {
            const [front, back] = await Promise.all([
              party.idFrontEnhanced ? uploadDataUrl(party.idFrontEnhanced, `${basePath}/party-${party.role}-${party.nationalId}-front-${timestamp}`) : Promise.resolve(null),
              party.idBackEnhanced ? uploadDataUrl(party.idBackEnhanced, `${basePath}/party-${party.role}-${party.nationalId}-back-${timestamp}`) : Promise.resolve(null),
            ]);
            return { partyName: party.name, role: party.role, front, back };
          })
        );
      }
      
      setUploadingImages(false);

      // Fetch user's IP address
      let userIpAddress: string | null = null;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIpAddress = ipData.ip || null;
      } catch (ipErr) {
        console.warn('Could not fetch IP address:', ipErr);
      }

      const { data: insertedData, error } = await supabase.from('terms_acceptances').insert({
        user_id: user.id, 
        organization_id: organization.id, 
        organization_type: organization.organization_type,
        organization_name: organization.name, 
        full_name: signerName || profile.full_name, 
        terms_version: currentTermsVersion,
        user_agent: navigator.userAgent,
        ip_address: userIpAddress,
        signer_national_id: nationalId, 
        signer_phone: signerPhone,
        signer_position: signerPosition, 
        signer_id_front_url: idFrontUrl, 
        signer_id_back_url: idBackUrl,
        signer_signature_url: signatureUrl, 
        verified_match: faceMatchResult?.faces_match || false,
        selfie_url: selfiePreview ? await uploadDataUrl(selfiePreview, `${basePath}/selfie-${timestamp}`) : null,
        business_doc_urls: businessDocUrls,
        business_doc_type: businessDocData.documentType || null,
        business_doc_extracted_data: businessDocData.extractedData || null,
        delegation_data: delegationData.isDelegate ? {
          type: delegationData.delegationType,
          delegation_urls: delegationUrls,
          parties: partyDocUrls,
        } : null,
        ai_review_status: 'pending',
      }).select('id').single();
      if (error) throw error;

      await supabase.from('profile_sensitive_data' as any).upsert({ 
        user_id: profile.user_id,
        national_id: nationalId, 
        id_card_front_url: idFrontUrl, 
        id_card_back_url: idBackUrl 
      }, { onConflict: 'user_id' });

      // Trigger AI review in background
      if (insertedData?.id) {
        supabase.functions.invoke('ai-onboarding-review', {
          body: {
            acceptance_id: insertedData.id,
            signer_name: signerName || profile.full_name,
            national_id: nationalId,
            organization_name: organization.name,
            organization_type: organization.organization_type,
            has_id_front: !!idFrontUrl,
            has_id_back: !!idBackUrl,
            has_selfie: !!selfiePreview,
            has_signature: !!signatureUrl,
            face_match: faceMatchResult?.faces_match || false,
            face_match_confidence: faceMatchResult?.match_confidence || 0,
            has_business_doc: businessDocUrls.length > 0,
            business_doc_type: businessDocData.documentType,
            business_doc_pages_count: businessDocUrls.length,
            has_delegation: delegationData.isDelegate,
            delegation_type: delegationData.delegationType,
            delegation_parties_count: delegationData.parties.length,
            signer_position: signerPosition,
            signer_phone: signerPhone,
            id_verification_confidence: frontResult?.confidence || 0,
          }
        }).then(async ({ data: reviewData }) => {
          if (reviewData?.success) {
            const review = reviewData.review;
            await supabase.from('terms_acceptances').update({
              ai_review_score: review.overall_score,
              ai_review_status: review.status,
              ai_review_reasons: review.checks,
              ai_review_summary: review.summary,
            }).eq('id', insertedData.id);
          }
        }).catch(err => console.error('AI review error:', err));
      }

      toast.success('تم تسجيل موافقتك على الشروط والأحكام بنجاح');
      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast.error('حدث خطأ أثناء تسجيل الموافقة');
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  const identityComplete = nationalId.length === 14 && signerPhone.trim() && signerPosition.trim() && idFrontFile && idBackFile && frontResult?.is_valid_document && businessDocData.documentType && businessDocData.pages.length > 0;
  const selfieComplete = selfiePreview && faceMatchResult?.faces_match;

  const getStepLabel = () => {
    switch (step) {
      case 'identity': return 'التحقق من الهوية';
      case 'selfie': return 'التحقق من الوجه';
      case 'terms': return termsTitle;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-3xl max-h-[92vh] p-0 overflow-hidden border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-l ${getOrgColor()} text-white px-6 py-5 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {getOrgIcon()}
              </div>
              <DialogTitle className="text-xl font-bold">آي ريسايكل</DialogTitle>
            </div>
            <DialogDescription className="text-white/90 text-center text-sm">
              {getStepLabel()}
            </DialogDescription>
            
            {/* 3-Step Indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {(['identity', 'selfie', 'terms'] as Step[]).map((s, i) => {
                const labels = ['التحقق من الهوية', 'التحقق من الوجه', 'الشروط والأحكام'];
                const icons = [<CreditCard key="id" className="w-3 h-3" />, <UserCheck key="face" className="w-3 h-3" />, <FileText key="terms" className="w-3 h-3" />];
                const isActive = step === s;
                const isDone = (['identity', 'selfie', 'terms'].indexOf(step) > i);
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronLeft className="w-3 h-3 text-white/30" />}
                    <button
                      onClick={() => isDone && setStep(s)}
                      disabled={!isDone}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        isActive ? 'bg-white text-gray-800 shadow-md' 
                        : isDone ? 'bg-white/20 text-white/90 hover:bg-white/30 cursor-pointer' 
                        : 'bg-white/10 text-white/40'
                      }`}
                    >
                      {isDone && <Check className="w-2.5 h-2.5" />}
                      {icons[i]}
                      <span className="hidden sm:inline">{labels[i]}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ====== IDENTITY STEP ====== */}
          {step === 'identity' && (
            <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <ScrollArea className="h-[50vh] px-6">
                <div className="py-5 space-y-5" dir="rtl">
                  {/* Info banner */}
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                      <ScanLine className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">مسح ذكي للبطاقة الشخصية</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        {idInputMode === 'scanner' 
                          ? 'وجّه الكاميرا نحو البطاقة وسيتم التقاطها تلقائياً عند دخولها الإطار مع تحسين الجودة'
                          : 'ارفع صور البطاقة وسيتم التحقق واستخراج البيانات تلقائياً'}
                      </p>
                    </div>
                  </div>

                  {/* Mode toggle: Scanner vs Upload */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIdInputMode('scanner')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        idInputMode === 'scanner'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/20 text-muted-foreground hover:bg-accent/50'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      مسح بالكاميرا
                    </button>
                    <button
                      onClick={() => setIdInputMode('upload')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        idInputMode === 'upload'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/20 text-muted-foreground hover:bg-accent/50'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      رفع صورة
                    </button>
                  </div>

                  {/* ID Card Section */}
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5 mb-3">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      صور البطاقة الشخصية / جواز السفر
                    </Label>

                    {idInputMode === 'scanner' ? (
                      /* Camera Scanner Mode */
                      <IDCardScanner
                        onCapture={handleScannerCapture}
                        onComplete={() => {}}
                        isVerifying={verifyingFront || verifyingBack}
                        frontCaptured={!!idFrontFile}
                        backCaptured={!!idBackFile}
                        frontVerified={!!frontResult?.is_valid_document}
                        backVerified={!!backResult?.is_valid_document}
                      />
                    ) : (
                      /* Upload Mode (original) */
                      <div className="grid grid-cols-2 gap-3">
                        {/* Front */}
                        <div>
                          <input ref={idFrontInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={(e) => handleFileChange('front', e.target.files?.[0] || null)} />
                          <div
                            onClick={() => !verifyingFront && !enhancingFront && idFrontInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                              frontResult?.is_valid_document 
                                ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20' 
                                : idFrontPreview 
                                  ? 'border-amber-400 bg-amber-50/50' 
                                  : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
                            }`}
                          >
                            {idFrontPreview ? (
                              <div className="relative">
                                <img src={idFrontEnhanced || idFrontPreview} alt="وجه البطاقة" className="w-full h-32 object-cover" />
                                {(enhancingFront || verifyingFront) && (
                                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    <span className="text-[10px] text-white font-medium">
                                      {enhancingFront ? 'تحسين الصورة...' : 'التحقق بالذكاء الاصطناعي...'}
                                    </span>
                                  </div>
                                )}
                                {frontResult?.is_valid_document && !verifyingFront && !enhancingFront && (
                                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                    <Check className="w-2.5 h-2.5" /> تم التحقق
                                  </div>
                                )}
                                {idFrontEnhanced && !enhancingFront && (
                                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5" /> محسّنة
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-7 gap-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <Upload className="w-5 h-5 text-muted-foreground/50" />
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium">وجه البطاقة</p>
                                <p className="text-[9px] text-muted-foreground/60">صوّر أو ارفع</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Back */}
                        <div>
                          <input ref={idBackInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                            onChange={(e) => handleFileChange('back', e.target.files?.[0] || null)} />
                          <div
                            onClick={() => !verifyingBack && !enhancingBack && idBackInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                              backResult?.is_valid_document 
                                ? 'border-green-400 bg-green-50/50 dark:bg-green-950/20' 
                                : idBackPreview 
                                  ? 'border-amber-400 bg-amber-50/50' 
                                  : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
                            }`}
                          >
                            {idBackPreview ? (
                              <div className="relative">
                                <img src={idBackEnhanced || idBackPreview} alt="ظهر البطاقة" className="w-full h-32 object-cover" />
                                {(enhancingBack || verifyingBack) && (
                                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    <span className="text-[10px] text-white font-medium">
                                      {enhancingBack ? 'تحسين الصورة...' : 'التحقق بالذكاء الاصطناعي...'}
                                    </span>
                                  </div>
                                )}
                                {backResult?.is_valid_document && !verifyingBack && !enhancingBack && (
                                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                    <Check className="w-2.5 h-2.5" /> تم التحقق
                                  </div>
                                )}
                                {idBackEnhanced && !enhancingBack && (
                                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5" /> محسّنة
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-7 gap-2">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <Upload className="w-5 h-5 text-muted-foreground/50" />
                                </div>
                                <p className="text-[11px] text-muted-foreground font-medium">ظهر البطاقة</p>
                                <p className="text-[9px] text-muted-foreground/60">صوّر أو ارفع</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* AI verification warnings */}
                    {frontResult && frontResult.warnings?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {frontResult.warnings.map((w, i) => (
                          <p key={i} className="text-[10px] text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> {w}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Auto-filled data from OCR */}
                  {(frontResult || backResult) && (
                    <div className="rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-800 dark:text-green-200">بيانات مستخرجة بالذكاء الاصطناعي</span>
                        <Badge variant="outline" className="text-[9px] border-green-300 text-green-700">
                          ثقة {frontResult?.confidence || backResult?.confidence}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {signerName && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">الاسم الكامل</p>
                            <p className="text-xs font-semibold">{signerName}</p>
                          </div>
                        )}
                        {signerDob && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">تاريخ الميلاد</p>
                            <p className="text-xs font-semibold">{signerDob}</p>
                          </div>
                        )}
                        {signerGender && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">النوع</p>
                            <p className="text-xs font-semibold">{signerGender}</p>
                          </div>
                        )}
                        {signerAddress && (
                          <div className="space-y-0.5 col-span-2">
                            <p className="text-[10px] text-muted-foreground">العنوان</p>
                            <p className="text-xs font-semibold">{signerAddress}</p>
                          </div>
                        )}
                        {signerReligion && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">الديانة</p>
                            <p className="text-xs font-semibold">{signerReligion}</p>
                          </div>
                        )}
                        {signerMaritalStatus && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">الحالة الاجتماعية</p>
                            <p className="text-xs font-semibold">{signerMaritalStatus}</p>
                          </div>
                        )}
                        {signerGovernorate && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">المحافظة</p>
                            <p className="text-xs font-semibold">{signerGovernorate}</p>
                          </div>
                        )}
                        {signerIdExpiry && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">تاريخ الانتهاء</p>
                            <p className="text-xs font-semibold">{signerIdExpiry}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="national-id" className="text-xs font-medium flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                          الرقم القومي (14 رقم)
                        </Label>
                        <Input id="national-id" value={nationalId}
                          onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                          placeholder="أدخل الرقم القومي"
                          className={`text-left font-mono text-sm h-10 ${nationalId && validateNationalId(nationalId) ? 'border-green-500 focus-visible:ring-green-500' : ''}`}
                          dir="ltr" maxLength={14}
                        />
                        {nationalId && !validateNationalId(nationalId) && (
                          <p className="text-[11px] text-destructive">يجب أن يتكون من 14 رقم</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signer-phone" className="text-xs font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          رقم الهاتف
                        </Label>
                        <Input id="signer-phone" value={signerPhone}
                          onChange={(e) => setSignerPhone(e.target.value)}
                          placeholder="أدخل رقم الهاتف" className="text-left text-sm h-10" dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signer-position" className="text-xs font-medium flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                        المسمى الوظيفي
                      </Label>
                      <Input id="signer-position" value={signerPosition}
                        onChange={(e) => setSignerPosition(e.target.value)}
                        placeholder="مثال: المدير التنفيذي، مدير العمليات" className="text-sm h-10"
                      />
                    </div>
                  </div>

                  {/* Business Document Section */}
                  <BusinessDocumentSection data={businessDocData} onUpdate={setBusinessDocData} />

                  {/* Delegation / Proxy Section */}
                  <DelegationSection delegationData={delegationData} onUpdate={setDelegationData} />

                  {/* Registered User Info */}
                  {profile && (
                    <div className="rounded-xl border bg-muted/30 p-3.5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-semibold">بيانات المستخدم المسجل</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><span className="text-muted-foreground">الاسم:</span> <span className="font-medium">{profile.full_name}</span></div>
                        <div><span className="text-muted-foreground">البريد:</span> <span className="font-medium">{user?.email}</span></div>
                      </div>
                      <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        يجب أن تتطابق بيانات الموقّع مع بيانات المستخدم المسجل
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t bg-muted/20 px-6 py-4">
                <Button onClick={handleProceedToSelfie}
                  className={`w-full gap-2 h-11 text-sm font-semibold bg-gradient-to-l ${getOrgColor()} hover:opacity-90 transition-opacity`}
                  disabled={!identityComplete || isVerifying}
                >
                  {isVerifying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري التحقق...</>
                  ) : (
                    <><span>متابعة للتحقق من الوجه</span><ChevronLeft className="w-4 h-4" /></>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ====== SELFIE STEP ====== */}
          {step === 'selfie' && (
            <motion.div key="selfie" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <ScrollArea className="h-[50vh] px-6">
                <div className="py-5 space-y-5" dir="rtl">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-purple-800 dark:text-purple-200">التحقق من الهوية بالصورة الشخصية</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                        التقط صورة شخصية واضحة لمقارنتها مع صورة البطاقة والتأكد من هويتك
                      </p>
                    </div>
                  </div>

                  {/* Camera / Selfie capture */}
                  <div className="flex flex-col items-center gap-4">
                    {!selfiePreview ? (
                      <>
                        {cameraActive ? (
                          <div className="relative w-full max-w-sm">
                            <video ref={selfieVideoRef} autoPlay playsInline muted 
                              className="w-full rounded-xl border-2 border-purple-300 aspect-[4/3] object-cover" 
                              style={{ transform: 'scaleX(-1)' }}
                            />
                            <canvas ref={selfieCanvasRef} className="hidden" />
                            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
                              <Button onClick={captureSelfie} size="lg"
                                className="rounded-full w-14 h-14 bg-white text-purple-600 hover:bg-purple-50 shadow-lg border-4 border-purple-400"
                              >
                                <Camera className="w-6 h-6" />
                              </Button>
                              <Button onClick={stopCamera} variant="destructive" size="sm" className="rounded-full">
                                إلغاء
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 py-6">
                            <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                              <Camera className="w-10 h-10 text-purple-400" />
                            </div>
                            <div className="flex gap-3">
                              <Button onClick={startCamera} variant="default" className="gap-2 bg-purple-600 hover:bg-purple-700">
                                <Camera className="w-4 h-4" /> فتح الكاميرا
                              </Button>
                              <div>
                                <input ref={selfieInputRef} type="file" accept="image/*" className="hidden"
                                  onChange={(e) => handleSelfieUpload(e.target.files?.[0] || null)} />
                                <Button onClick={() => selfieInputRef.current?.click()} variant="outline" className="gap-2">
                                  <ImagePlus className="w-4 h-4" /> رفع صورة
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <img src={selfiePreview} alt="صورة شخصية" 
                            className="w-40 h-40 rounded-full object-cover border-4 border-purple-300 shadow-lg" 
                          />
                          {faceMatchResult?.faces_match && (
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-white">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setSelfiePreview(null); setSelfieFile(null); }}
                          className="text-xs text-muted-foreground"
                        >
                          إعادة التقاط
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Face match button & result */}
                  {selfiePreview && !faceMatchResult && (
                    <Button onClick={handleVerifyFace} disabled={verifyingFace}
                      className="w-full gap-2 bg-purple-600 hover:bg-purple-700 h-11"
                    >
                      {verifyingFace ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> جاري مقارنة الوجه...</>
                      ) : (
                        <><UserCheck className="w-4 h-4" /> التحقق من تطابق الوجه</>
                      )}
                    </Button>
                  )}

                  {faceMatchResult && (
                    <div className={`rounded-xl border-2 p-4 text-center ${
                      faceMatchResult.faces_match 
                        ? 'border-green-300 bg-green-50 dark:bg-green-950/20' 
                        : 'border-red-300 bg-red-50 dark:bg-red-950/20'
                    }`}>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {faceMatchResult.faces_match ? (
                          <><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-sm font-bold text-green-800">تم التحقق - الوجه مطابق ✓</span></>
                        ) : (
                          <><AlertTriangle className="w-5 h-5 text-red-600" /><span className="text-sm font-bold text-red-800">الوجه غير مطابق</span></>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{faceMatchResult.details}</p>
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        نسبة التطابق: {faceMatchResult.match_confidence}%
                      </Badge>
                      {!faceMatchResult.faces_match && (
                        <Button variant="outline" size="sm" className="mt-3 text-xs"
                          onClick={() => { setSelfiePreview(null); setSelfieFile(null); setVerifyingFace(false); }}
                        >
                          إعادة المحاولة
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Side by side comparison */}
                  {selfiePreview && idFrontPreview && (
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-center">
                        <img src={idFrontEnhanced || idFrontPreview} alt="صورة البطاقة" className="w-20 h-20 rounded-lg object-cover border" />
                        <p className="text-[10px] text-muted-foreground mt-1">صورة البطاقة</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div className="text-center">
                        <img src={selfiePreview} alt="الصورة الشخصية" className="w-20 h-20 rounded-lg object-cover border" />
                        <p className="text-[10px] text-muted-foreground mt-1">الصورة الشخصية</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t bg-muted/20 px-6 py-4 flex gap-2.5">
                <Button variant="outline" onClick={() => { stopCamera(); setStep('identity'); }} className="gap-1.5 text-xs h-10">
                  <ChevronRight className="w-3.5 h-3.5" /> رجوع
                </Button>
                <Button onClick={handleProceedToTerms}
                  className={`flex-1 gap-2 h-10 text-sm font-semibold bg-gradient-to-l ${getOrgColor()} hover:opacity-90`}
                  disabled={!selfieComplete}
                >
                  <span>متابعة للشروط والأحكام</span>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ====== TERMS STEP ====== */}
          {step === 'terms' && (
            <motion.div key="terms" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <ScrollArea className="h-[44vh] px-6">
                <div className="py-5 space-y-5" dir="rtl">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed pt-1">
                      {getWarningText()}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {termsSections.map((section, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group">
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
                        </div>
                        <div className="space-y-1.5 pr-8">
                          {section.content.map((paragraph, pIndex) => (
                            <p key={pIndex} className="text-xs text-muted-foreground leading-relaxed">{paragraph}</p>
                          ))}
                        </div>
                        {index < termsSections.length - 1 && <Separator className="mt-4" />}
                      </motion.div>
                    ))}
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Scale className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold">المراجع القانونية</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {legalReferences.map((ref, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Signer Summary */}
                  {organization && profile && (
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                      <h4 className="font-semibold text-xs text-center mb-3 flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        ملخص بيانات الموقّع
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الشركة</p>
                          <p className="text-xs font-semibold truncate">{organization.name}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الاسم</p>
                          <p className="text-xs font-semibold truncate">{signerName || profile.full_name}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">المنصب</p>
                          <p className="text-xs font-semibold truncate">{signerPosition}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الرقم القومي</p>
                          <p className="text-xs font-mono font-semibold">{nationalId}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">الهاتف</p>
                          <p className="text-xs font-semibold">{signerPhone}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">التاريخ</p>
                          <p className="text-xs font-semibold">{new Date().toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-3">
                        {idFrontPreview && <img src={idFrontEnhanced || idFrontPreview} alt="وجه" className="h-12 rounded border object-cover" />}
                        {idBackPreview && <img src={idBackEnhanced || idBackPreview} alt="ظهر" className="h-12 rounded border object-cover" />}
                        {selfiePreview && <img src={selfiePreview} alt="صورة شخصية" className="h-12 w-12 rounded-full border object-cover" />}
                      </div>
                      {faceMatchResult?.faces_match && (
                        <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-[10px] font-medium">تم التحقق من تطابق الوجه ({faceMatchResult.match_confidence}%)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="border-t bg-muted/20 px-6 py-4 space-y-3">
                {/* Signature Mode Toggle */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <PenTool className="w-3.5 h-3.5" /> التوقيع
                  </Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSignatureMode('electronic'); setUploadedSignaturePreview(null); setSignatureDataUrl(null); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        signatureMode === 'electronic'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/20 text-muted-foreground hover:bg-accent/50'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      توقيع إلكتروني
                    </button>
                    <button
                      onClick={() => { setSignatureMode('upload'); signaturePadRef.current?.clear(); setSignatureDataUrl(null); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        signatureMode === 'upload'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/20 text-muted-foreground hover:bg-accent/50'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      رفع توقيع ورقي
                    </button>
                  </div>

                  {signatureMode === 'electronic' ? (
                    <SignaturePad ref={signaturePadRef} onSignatureChange={setSignatureDataUrl} width={500} height={100} />
                  ) : (
                    <div>
                      <input ref={signatureUploadRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => handleSignatureUpload(e.target.files?.[0] || null)} />
                      {uploadedSignaturePreview ? (
                        <div className="relative border-2 border-green-300 rounded-xl overflow-hidden bg-white">
                          <img src={uploadedSignaturePreview} alt="التوقيع" className="w-full h-24 object-contain p-2" />
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                            <Check className="w-2.5 h-2.5" /> تم الرفع
                          </div>
                          <button
                            onClick={() => { setUploadedSignaturePreview(null); setSignatureDataUrl(null); }}
                            className="absolute top-1.5 right-1.5 text-[9px] text-muted-foreground hover:text-destructive bg-white/80 rounded-full px-1.5 py-0.5"
                          >
                            تغيير
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => signatureUploadRef.current?.click()}
                          className="border-2 border-dashed border-muted-foreground/20 rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-all"
                        >
                          <Upload className="w-6 h-6 text-muted-foreground/40" />
                          <p className="text-xs text-muted-foreground">اضغط لرفع صورة التوقيع المكتوب على ورقة</p>
                          <p className="text-[9px] text-muted-foreground/60">يُفضل خلفية بيضاء وحبر أسود أو أزرق</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2.5">
                  <Checkbox id="terms-agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} className="mt-0.5" />
                  <label htmlFor="terms-agree" className="text-[11px] cursor-pointer leading-relaxed text-muted-foreground">
                    {agreementText}
                  </label>
                </div>

                <div className="flex gap-2.5">
                  <Button variant="outline" onClick={() => setStep('selfie')} className="gap-1.5 text-xs h-10">
                    <ChevronRight className="w-3.5 h-3.5" /> رجوع
                  </Button>
                  <Button onClick={handleAcceptTerms}
                    disabled={!agreed || submitting || !signatureDataUrl}
                    className={`flex-1 gap-2 h-10 text-xs font-semibold bg-gradient-to-l ${getOrgColor()} hover:opacity-90`}
                  >
                    {submitting ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />{uploadingImages ? 'جاري رفع الصور...' : 'جاري التسجيل...'}</>
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5" />الموافقة والمتابعة</>
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-center text-muted-foreground">
                  موافقة ملزمة قانونياً وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationTermsDialog;
