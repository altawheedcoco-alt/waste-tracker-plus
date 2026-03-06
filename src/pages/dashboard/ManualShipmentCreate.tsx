import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import ManualShipmentForm from '@/components/shipments/ManualShipmentForm';
import { useManualShipmentDraft } from '@/hooks/useManualShipmentDraft';
import { useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const ManualShipmentCreate = () => {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft') || undefined;

  const {
    form, setForm, updateField,
    loading, saving,
    savedDraftId, savedShareCode,
    saveDraft, submitDraft, resetForm,
    saveAndDownloadPDF, saveAndSendWhatsApp, saveAndPrintPDF,
  } = useManualShipmentDraft(draftId);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
        <BackButton />

        {/* Page Header */}
        <div className="flex items-center gap-4 mb-4 mt-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="text-right flex-1">
            <h1 className="text-2xl font-bold tracking-tight">إنشاء نموذج شحنة يدوي</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أدخل جميع البيانات يدوياً — احفظ، صدّر PDF، أو شارك برابط قابل للتعديل
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
          onExportPDF={() => {}}
          onSaveAndDownloadPDF={saveAndDownloadPDF}
          onSaveAndSendWhatsApp={saveAndSendWhatsApp}
          onSaveAndPrintPDF={saveAndPrintPDF}
        />
      </div>
    </DashboardLayout>
  );
};

export default ManualShipmentCreate;
