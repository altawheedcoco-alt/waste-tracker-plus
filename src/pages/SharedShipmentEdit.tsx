import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ManualShipmentForm from '@/components/shipments/ManualShipmentForm';
import { useManualShipmentDraft } from '@/hooks/useManualShipmentDraft';
import { generateManualShipmentPDF } from '@/utils/manualShipmentPdf';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SharedShipmentEdit = () => {
  const { code } = useParams<{ code: string }>();
  const {
    form, setForm, updateField,
    loading, saving,
    savedDraftId, savedShareCode,
    saveDraft, submitDraft, resetForm,
  } = useManualShipmentDraft(undefined, code);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!savedDraftId && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-xl font-bold">لم يتم العثور على النموذج</h1>
        <p className="text-muted-foreground">تأكد من صحة الرابط أو تواصل مع مرسل النموذج</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto p-4 md:p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="text-right flex-1">
            <h1 className="text-xl font-bold">تعديل نموذج الشحنة</h1>
            <p className="text-sm text-muted-foreground">
              عدّل البيانات ثم اضغط "إرسال" لإعادة إرسال النموذج المحدّث
            </p>
          </div>
        </div>

        <ManualShipmentForm
          form={form}
          updateField={updateField}
          setForm={setForm}
          saving={saving}
          savedShareCode={savedShareCode}
          onSave={saveDraft}
          onSubmit={submitDraft}
          onReset={resetForm}
          onExportPDF={() => generateManualShipmentPDF(form)}
        />
      </div>
    </div>
  );
};

export default SharedShipmentEdit;
