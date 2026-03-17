import { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Printer, FileCheck, BadgeCheck as Stamp, BadgeCheck, Download, X, Eye, FileSignature, Send, PenTool, Trash2, User } from 'lucide-react';
import { MentionableField, type MentionableEntity } from '@/components/ui/mentionable-field';
import { useMentionableEntities } from '@/hooks/useMentionableEntities';
import { MentionInput } from '@/components/ui/mention-input';
import { useMentionableUsers } from '@/hooks/useMentionableUsers';
import MentionToSignDialog from '@/components/documents/MentionToSignDialog';
import BackButton from '@/components/ui/back-button';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { usePDFExport } from '@/hooks/usePDFExport';
import TermsBackPage from '@/components/print/TermsBackPage';
import UniversalSignatureDialog from '@/components/signatures/UniversalSignatureDialog';
import type { SignatureData } from '@/components/signatures/UniversalSignatureDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { saveDocumentSignature } from '@/components/signatures/signatureService';
import { useResolvedUrl } from '@/hooks/useResolvedUrl';

const STAMP_VERSION = '1.0.0';

const generateDocCode = () => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ADM-${yy}${mm}-${rand}`;
};

// A single signer record displayed on the document
interface DocumentSigner {
  id: string;
  signerName: string;
  signerTitle?: string;
  signerNationalId?: string;
  method: SignatureData['method'];
  signatureImageUrl?: string;
  signatureText?: string;
  stampApplied: boolean;
  stampImageUrl?: string;
  signedAt: Date;
}

// Resolved image component for storage paths
const ResolvedImage = ({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) => {
  const resolvedUrl = useResolvedUrl(src);
  if (!resolvedUrl) return null;
  return <img src={resolvedUrl} alt={alt} className={className} style={style} />;
};

const AdminDocumentStamping = () => {
  const { toast } = useToast();
  const { user, organization, profile } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, printContent } = usePDFExport({ filename: 'stamped-document' });
  const { entities, organizationEntities } = useMentionableEntities();
  const { users } = useMentionableUsers();

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientOrg, setRecipientOrg] = useState('');
  const [docCode] = useState(generateDocCode);
  const [isStamped, setIsStamped] = useState(false);
  const [stampDate] = useState(new Date());
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);

  // Multiple signers on the document
  const [signers, setSigners] = useState<DocumentSigner[]>([]);

  // Organization stamp
  const [orgStampUrl, setOrgStampUrl] = useState<string | null>(null);
  const [orgSignatureUrl, setOrgSignatureUrl] = useState<string | null>(null);

  // Fetch org stamp and signature when component mounts
  const fetchOrgAssets = useCallback(async () => {
    if (!organization?.id) return;
    const [{ data: stamp }, { data: sig }] = await Promise.all([
      (supabase.from('organization_stamps') as any)
        .select('stamp_image_url')
        .eq('organization_id', organization.id)
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle(),
      (supabase.from('organization_signatures') as any)
        .select('signature_image_url')
        .eq('organization_id', organization.id)
        .eq('is_primary', true)
        .eq('is_active', true)
        .maybeSingle(),
    ]);
    if (stamp) setOrgStampUrl(stamp.stamp_image_url);
    if (sig) setOrgSignatureUrl(sig.signature_image_url);
  }, [organization?.id]);

  // Load on mount
  useState(() => { fetchOrgAssets(); });

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'الملف كبير جداً', description: 'الحد الأقصى 10 ميجابايت', variant: 'destructive' });
      return;
    }
    setDocFile(file);
    if (file.type.startsWith('image/')) {
      setDocPreviewUrl(URL.createObjectURL(file));
    } else {
      setDocPreviewUrl(null);
    }
    if (!docTitle) setDocTitle(file.name.replace(/\.[^.]+$/, ''));
  }, [docTitle, toast]);

  const handleStamp = () => {
    if (!docFile) {
      toast({ title: 'يرجى رفع مستند أولاً', variant: 'destructive' });
      return;
    }
    if (!docTitle.trim()) {
      toast({ title: 'يرجى إدخال عنوان المستند', variant: 'destructive' });
      return;
    }
    setIsStamped(true);
    toast({ title: 'تم ختم المستند بنجاح ✅', description: `كود المستند: ${docCode}` });
  };

  const handleSignDocument = async (data: SignatureData) => {
    if (!user || !organization) return;
    setSigningLoading(true);

    try {
      // Save to DB
      const result = await saveDocumentSignature({
        signatureData: data,
        documentType: 'other',
        documentId: docCode,
        organizationId: organization.id,
        userId: user.id,
      });

      // Add to local signers list for display on the document
      const newSigner: DocumentSigner = {
        id: result.signatureId || crypto.randomUUID(),
        signerName: data.signerName,
        signerTitle: data.signerTitle,
        signerNationalId: data.signerNationalId,
        method: data.method,
        signatureImageUrl: data.signatureImageUrl,
        signatureText: data.signatureText,
        stampApplied: data.stampApplied,
        stampImageUrl: data.stampImageUrl,
        signedAt: new Date(),
      };
      setSigners(prev => [...prev, newSigner]);
      setShowSignatureDialog(false);

      toast({
        title: 'تم التوقيع والختم بنجاح ✅',
        description: `${data.signerName} — ${result.sealNumber || ''}`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSigningLoading(false);
    }
  };

  const removeSigner = (id: string) => {
    setSigners(prev => prev.filter(s => s.id !== id));
  };

  const handlePrint = () => {
    if (printRef.current) printContent(printRef.current);
  };

  const handleDownloadPDF = () => {
    if (printRef.current) exportToPDF(printRef.current, `مستند-مختوم-${docCode}`);
  };

  const handleClear = () => {
    setDocFile(null);
    setDocPreviewUrl(null);
    setDocTitle('');
    setDocDescription('');
    setRecipientName('');
    setRecipientOrg('');
    setIsStamped(false);
    setSigners([]);
  };

  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/qr-verify?type=admin-stamped&code=${encodeURIComponent(docCode)}&date=${stampDate.toISOString()}`;

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto" dir="rtl">
      <BackButton />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stamp className="h-7 w-7 text-primary" />
            ختم وتوقيع المستندات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ارفع مستند واختمه إلكترونياً مع التوقيع المباشر على أصل المستند</p>
        </div>
        {isStamped && (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowSignatureDialog(true)} className="gap-2 bg-green-600 hover:bg-green-700">
              <PenTool className="h-4 w-4" /> توقيع وختم على المستند
            </Button>
            <Button onClick={() => setShowSignDialog(true)} variant="outline" className="gap-2">
              <Send className="h-4 w-4" /> إرسال للتوقيع
            </Button>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" /> طباعة
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" /> تحميل PDF
            </Button>
          </div>
        )}
      </div>

      {/* Input Form */}
      {!isStamped && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" /> رفع وتجهيز المستند
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <Label>المستند (صورة أو PDF)</Label>
              <div className="mt-1.5">
                {!docFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">اضغط لرفع المستند أو اسحبه هنا</span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG — حتى 10MB</span>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileCheck className="h-8 w-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{docFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(docFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    {docPreviewUrl && (
                      <img src={docPreviewUrl} alt="معاينة" className="h-16 w-16 object-cover rounded border" />
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setDocFile(null); setDocPreviewUrl(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>عنوان المستند *</Label>
                <Input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="مثال: خطاب تفويض نقل" className="mt-1.5" />
              </div>
              <div>
                <Label>كود المستند</Label>
                <Input value={docCode} readOnly className="mt-1.5 font-mono bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المستلم / الموجه إليه</Label>
                <MentionableField
                  value={recipientName}
                  onChange={setRecipientName}
                  entities={entities}
                  placeholder="اكتب @ للإشارة أو اكتب الاسم يدوياً"
                  onEntitySelect={(e) => {
                    if (e.type === 'organization') {
                      setRecipientOrg(e.name);
                      setRecipientName('');
                    }
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>جهة المستلم</Label>
                <MentionableField
                  value={recipientOrg}
                  onChange={setRecipientOrg}
                  entities={organizationEntities}
                  placeholder="اختياري — اكتب @ للاختيار"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>وصف / ملاحظات</Label>
              <MentionInput
                value={docDescription}
                onChange={setDocDescription}
                users={users}
                placeholder="اختياري — يظهر في المستند المختوم (@ للإشارة)"
                rows={3}
                className="mt-1.5"
              />
            </div>

            <Button onClick={handleStamp} size="lg" className="w-full gap-2 text-base">
              <Stamp className="h-5 w-5" />
              ختم وتجهيز المستند
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Signers List (outside print area) */}
      {isStamped && signers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              التوقيعات المطبقة على المستند ({signers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {signers.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <User className="h-5 w-5 text-green-700 dark:text-green-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.signerName}</p>
                    <p className="text-xs text-muted-foreground">{s.signerTitle || 'موقّع'} • {format(s.signedAt, 'HH:mm dd/MM/yyyy')}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {s.method === 'draw' ? 'رسم يدوي' : s.method === 'upload' ? 'صورة' : s.method === 'text' ? 'نصي' : 'نقرة'}
                      </Badge>
                      {s.stampApplied && <Badge className="text-[10px] bg-primary/20 text-primary">+ ختم</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeSigner(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stamped Document Preview */}
      {isStamped && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">معاينة المستند — التوقيعات والأختام تظهر مباشرة على المستند المطبوع</p>
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" /> مستند جديد
            </Button>
          </div>

          <div ref={printRef} className="bg-white border rounded-lg" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif', width: '210mm', margin: '0 auto' }}>
            {/* Page 1 — The Stamped Document */}
            <div style={{ padding: '15mm 15mm 20mm 15mm', minHeight: '297mm', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 mb-6" style={{ borderBottom: '3px double hsl(var(--primary))' }}>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '16pt', fontWeight: 'bold', color: 'hsl(var(--primary))' }}>
                      منصة iRecycle
                    </h1>
                    <p style={{ fontSize: '8pt', color: '#888' }}>لإدارة المخلفات والاستدامة البيئية</p>
                  </div>
                </div>
                <div className="text-left" style={{ direction: 'ltr' }}>
                  <Barcode value={docCode} width={1.2} height={35} fontSize={8} displayValue />
                </div>
              </div>

              {/* Document Title Banner */}
              <div className="text-center py-3 px-4 rounded-lg mb-6" style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}>
                <h2 style={{ fontSize: '14pt', fontWeight: 'bold' }}>مستند رسمي مختوم</h2>
                <p style={{ fontSize: '9pt', opacity: 0.9 }}>OFFICIALLY STAMPED & SIGNED DOCUMENT</p>
              </div>

              {/* Document Info Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', fontWeight: 'bold', width: '30%' }}>عنوان المستند</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px 14px' }}>{docTitle}</td>
                  </tr>
                  <tr>
                    <td style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', fontWeight: 'bold' }}>كود المستند</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px 14px', fontFamily: 'monospace', letterSpacing: '2px' }}>{docCode}</td>
                  </tr>
                  <tr>
                    <td style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', fontWeight: 'bold' }}>تاريخ الختم</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px 14px' }}>{format(stampDate, 'dd MMMM yyyy — HH:mm', { locale: ar })}</td>
                  </tr>
                  <tr>
                    <td style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', fontWeight: 'bold' }}>عدد الموقعين</td>
                    <td style={{ border: '1px solid #e2e8f0', padding: '10px 14px' }}>
                      {signers.length > 0 ? `${signers.length} توقيع` : 'لم يتم التوقيع بعد'}
                    </td>
                  </tr>
                  {recipientName && (
                    <tr>
                      <td style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', fontWeight: 'bold' }}>الموجه إليه</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px 14px' }}>{recipientName}</td>
                    </tr>
                  )}
                  {recipientOrg && (
                    <tr>
                      <td style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', fontWeight: 'bold' }}>الجهة</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '10px 14px' }}>{recipientOrg}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Description */}
              {docDescription && (
                <div className="rounded-lg px-4 py-3 mb-6" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '4px' }}>ملاحظات / وصف المستند:</p>
                  <p style={{ fontSize: '9.5pt', lineHeight: '1.7' }}>{docDescription}</p>
                </div>
              )}

              {/* Document Image Preview */}
              {docPreviewUrl && (
                <div className="mb-6 text-center">
                  <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '8px', textAlign: 'right' }}>
                    <Eye className="inline-block w-4 h-4 ml-1" /> صورة المستند المرفق:
                  </p>
                  <div className="border rounded-lg p-2 inline-block" style={{ maxWidth: '100%' }}>
                    <img src={docPreviewUrl} alt="المستند" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {/* Non-image file indicator */}
              {docFile && !docPreviewUrl && (
                <div className="mb-6 p-4 rounded-lg text-center" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <FileCheck className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p style={{ fontSize: '10pt', fontWeight: 'bold' }}>مرفق: {docFile.name}</p>
                  <p style={{ fontSize: '8pt', color: '#666' }}>({(docFile.size / 1024).toFixed(0)} KB)</p>
                </div>
              )}

              {/* ========== SIGNATURES & STAMPS ON DOCUMENT ========== */}
              {signers.length > 0 && (
                <div className="mb-6" style={{ border: '2px solid #16a34a', borderRadius: '8px', padding: '16px' }}>
                  <div className="text-center mb-4">
                    <p style={{ fontSize: '11pt', fontWeight: 'bold', color: '#16a34a', marginBottom: '4px' }}>
                      ✅ التوقيعات والأختام المطبقة على المستند
                    </p>
                    <p style={{ fontSize: '7.5pt', color: '#666' }}>
                      APPLIED SIGNATURES & STAMPS
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: signers.length === 1 ? '1fr' : signers.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
                    gap: '16px',
                  }}>
                    {signers.map((signer, idx) => (
                      <div key={signer.id} style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                        backgroundColor: '#fafffe',
                      }}>
                        {/* Signer Number */}
                        <p style={{ fontSize: '7pt', color: '#9ca3af', marginBottom: '6px' }}>
                          الطرف الموقع ({idx + 1})
                        </p>

                        {/* Signature Display */}
                        <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          {signer.signatureImageUrl ? (
                            <img
                              src={signer.signatureImageUrl}
                              alt={`توقيع ${signer.signerName}`}
                              style={{ maxHeight: '70px', maxWidth: '160px', objectFit: 'contain' }}
                            />
                          ) : signer.signatureText ? (
                            <p style={{ fontFamily: "'Amiri', serif", fontSize: '20pt', color: '#1a365d' }}>
                              {signer.signatureText}
                            </p>
                          ) : (
                            <div style={{ borderBottom: '2px solid #1a365d', width: '120px', paddingBottom: '4px' }}>
                              <p style={{ fontSize: '8pt', color: '#666' }}>توقيع إلكتروني</p>
                            </div>
                          )}
                        </div>

                        {/* Stamp */}
                        {signer.stampApplied && signer.stampImageUrl && (
                          <div style={{ margin: '8px auto', position: 'relative' }}>
                            <ResolvedImage
                              src={signer.stampImageUrl}
                              alt="ختم"
                              style={{ height: '70px', width: '70px', objectFit: 'contain', margin: '0 auto', opacity: 0.85 }}
                            />
                          </div>
                        )}

                        {/* Signer Details */}
                        <div style={{ borderTop: '1px dashed #d1d5db', paddingTop: '8px', marginTop: '4px' }}>
                          <p style={{ fontSize: '10pt', fontWeight: 'bold', color: '#111' }}>
                            {signer.signerName}
                          </p>
                          {signer.signerTitle && (
                            <p style={{ fontSize: '8pt', color: '#555' }}>{signer.signerTitle}</p>
                          )}
                          {signer.signerNationalId && (
                            <p style={{ fontSize: '7pt', color: '#888', fontFamily: 'monospace' }}>
                              ر.ق: {signer.signerNationalId}
                            </p>
                          )}
                          <p style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '4px' }}>
                            {format(signer.signedAt, 'dd/MM/yyyy — HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spacer to push footer down */}
              <div className="flex-1" />

              {/* Stamp + QR Footer */}
              <div className="pt-6 mt-6" style={{ borderTop: '3px double hsl(var(--primary))' }}>
                <div className="grid grid-cols-3 gap-6 items-end">
                  {/* Platform Signature */}
                  <div className="text-center">
                    <p style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '8px' }}>توقيع المنصة</p>
                    <div style={{ borderBottom: '2px solid hsl(var(--primary))', width: '120px', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '8pt', color: '#666' }}>مدير النظام — iRecycle</p>
                    <p style={{ fontSize: '7pt', color: '#999' }}>توقيع إلكتروني معتمد</p>
                  </div>

                  {/* Platform Seal */}
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center rounded-full" style={{
                      width: '90px', height: '90px',
                      border: '3px double hsl(var(--primary) / 0.5)',
                      background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05), hsl(var(--primary) / 0.12))',
                    }}>
                      <div className="text-center">
                        <BadgeCheck className="w-7 h-7 text-primary mx-auto" />
                        <span className="text-primary font-bold block" style={{ fontSize: '7pt' }}>iRecycle</span>
                        <span className="block" style={{ fontSize: '5pt', color: 'hsl(var(--primary))' }}>مختوم رقمياً</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '6pt', color: '#999', marginTop: '4px' }}>ختم المنصة الإلكتروني</p>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    <QRCodeSVG value={qrValue} size={80} level="H" />
                    <p style={{ fontSize: '6.5pt', color: '#999', marginTop: '4px' }}>امسح للتحقق من صحة المستند</p>
                  </div>
                </div>

                {/* Legal footer */}
                <div className="mt-6 pt-3 text-center" style={{ borderTop: '1px dashed #d1d5db', fontSize: '6.5pt', color: '#9ca3af' }}>
                  <p>هذا المستند مختوم وموقّع إلكترونياً من منصة iRecycle • التوقيعات الإلكترونية مُلزمة وفقاً لقانون التوقيع الإلكتروني 15/2004</p>
                  <p>يمكن التحقق من صحة المستند عبر مسح رمز QR أو إدخال كود المستند ({docCode}) في بوابة التحقق</p>
                  <p className="mt-1">© {new Date().getFullYear()} iRecycle — جميع الحقوق محفوظة • محمي بتقنية SHA-256</p>
                </div>
              </div>
            </div>

            {/* Page 2 — Terms Back Page */}
            <TermsBackPage />
          </div>
        </>
      )}

      {/* Mention to Sign Dialog */}
      <MentionToSignDialog
        open={showSignDialog}
        onOpenChange={setShowSignDialog}
        documentTitle={docTitle}
        documentType="admin_stamped"
        documentId={docCode}
      />

      {/* Universal Signature Dialog */}
      <UniversalSignatureDialog
        open={showSignatureDialog}
        onOpenChange={setShowSignatureDialog}
        onSign={handleSignDocument}
        documentType="other"
        documentId={docCode}
        documentTitle={docTitle}
        organizationId={organization?.id || ''}
        organizationStampUrl={orgStampUrl || undefined}
        signerDefaults={{
          name: profile?.full_name || '',
          title: '',
        }}
        loading={signingLoading}
      />
    </div>
  );
};

export default AdminDocumentStamping;
