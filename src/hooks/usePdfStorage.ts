/**
 * PDF Cloud Storage Hook - رفع وإدارة ملفات PDF على Supabase Storage
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const BUCKET_NAME = 'pdf-documents';

export interface PdfUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface StoredPdf {
  name: string;
  path: string;
  size: number;
  createdAt: string;
  url: string;
}

export function usePdfStorage() {
  const { user, organization } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * رفع ملف PDF إلى السحابة
   */
  const uploadPdf = useCallback(async (
    file: File,
    folder?: string
  ): Promise<PdfUploadResult> => {
    if (!user?.id) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    if (file.type !== 'application/pdf') {
      return { success: false, error: 'يجب أن يكون الملف بصيغة PDF' };
    }

    // Max 50MB
    if (file.size > 52428800) {
      return { success: false, error: 'حجم الملف يجب أن يكون أقل من 50 ميجابايت' };
    }

    setUploading(true);
    setProgress(0);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const folderPath = folder || organization?.id || 'general';
      const filePath = `${user.id}/${folderPath}/${timestamp}-${sanitizedName}`;

      setProgress(30);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      setProgress(70);

      // Get signed URL (valid for 1 year)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(data.path, 31536000); // 1 year

      if (urlError) throw urlError;

      setProgress(100);

      toast.success('تم رفع الملف بنجاح');
      
      return {
        success: true,
        url: signedUrlData.signedUrl,
        path: data.path,
      };
    } catch (error: any) {
      console.error('PDF upload error:', error);
      toast.error(`فشل رفع الملف: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [user?.id, organization?.id]);

  /**
   * الحصول على قائمة ملفات PDF المرفوعة
   */
  const listPdfs = useCallback(async (folder?: string): Promise<StoredPdf[]> => {
    if (!user?.id) return [];

    try {
      const folderPath = folder 
        ? `${user.id}/${folder}`
        : user.id;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      // Get signed URLs for all files
      const pdfs = await Promise.all(
        (data || [])
          .filter(item => item.name.endsWith('.pdf'))
          .map(async (item) => {
            const fullPath = `${folderPath}/${item.name}`;
            const { data: signedUrl } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(fullPath, 3600); // 1 hour

            return {
              name: item.name,
              path: fullPath,
              size: item.metadata?.size || 0,
              createdAt: item.created_at || '',
              url: signedUrl?.signedUrl || '',
            };
          })
      );

      return pdfs;
    } catch (error) {
      console.error('List PDFs error:', error);
      return [];
    }
  }, [user?.id]);

  /**
   * حذف ملف PDF
   */
  const deletePdf = useCallback(async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) throw error;

      toast.success('تم حذف الملف');
      return true;
    } catch (error: any) {
      console.error('Delete PDF error:', error);
      toast.error(`فشل حذف الملف: ${error.message}`);
      return false;
    }
  }, []);

  /**
   * الحصول على رابط تحميل مؤقت
   */
  const getDownloadUrl = useCallback(async (
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Get download URL error:', error);
      return null;
    }
  }, []);

  return {
    uploadPdf,
    listPdfs,
    deletePdf,
    getDownloadUrl,
    uploading,
    progress,
  };
}

export default usePdfStorage;
