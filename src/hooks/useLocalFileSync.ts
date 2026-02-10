/**
 * Local File Sync Hook - حفظ الملفات تلقائياً على جهاز المستخدم
 * يستخدم File System Access API للحفظ المباشر
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface SyncedFile {
  name: string;
  type: string;
  size: number;
  savedAt: string;
  cloudUrl?: string;
}

const STORAGE_KEY = 'local_file_sync_handle';
const SYNCED_FILES_KEY = 'synced_files_list';

export function useLocalFileSync() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [syncedFiles, setSyncedFiles] = useState<SyncedFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Check if File System Access API is supported
  useEffect(() => {
    setIsSupported('showDirectoryPicker' in window);
    
    // Load synced files list (tab-scoped)
    const saved = sessionStorage.getItem(SYNCED_FILES_KEY);
    if (saved) {
      setSyncedFiles(JSON.parse(saved));
    }
  }, []);

  /**
   * طلب إذن الوصول لمجلد على جهاز المستخدم (مرة واحدة)
   */
  const requestFolderAccess = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('متصفحك لا يدعم الحفظ المباشر للملفات');
      return false;
    }

    try {
      // @ts-ignore - File System Access API
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });
      
      setDirectoryHandle(handle);
      
      // Try to persist the handle (may not work in all browsers)
      try {
        // @ts-ignore
        if (navigator.storage && navigator.storage.getDirectory) {
          sessionStorage.setItem(STORAGE_KEY, 'granted');
        }
      } catch (e) {
        console.log('Cannot persist directory handle');
      }
      
      toast.success(`تم ربط المجلد: ${handle.name}`);
      return true;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Folder access error:', error);
        toast.error('فشل في الوصول للمجلد');
      }
      return false;
    }
  }, [isSupported]);

  /**
   * حفظ ملف في المجلد المحلي
   */
  const saveFileLocally = useCallback(async (
    file: File | Blob,
    fileName: string,
    subfolder?: string,
    cloudUrl?: string
  ): Promise<boolean> => {
    if (!directoryHandle) {
      // Try to request access first
      const granted = await requestFolderAccess();
      if (!granted) return false;
    }

    if (!directoryHandle) return false;

    setIsSaving(true);

    try {
      let targetDir = directoryHandle;

      // Create subfolder if specified
      if (subfolder) {
        try {
          targetDir = await directoryHandle.getDirectoryHandle(subfolder, { create: true });
        } catch (e) {
          console.error('Cannot create subfolder:', e);
        }
      }

      // Create or overwrite the file
      const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      // Update synced files list
      const newFile: SyncedFile = {
        name: fileName,
        type: file.type,
        size: file.size,
        savedAt: new Date().toISOString(),
        cloudUrl,
      };

      const updatedFiles = [...syncedFiles.filter(f => f.name !== fileName), newFile];
      setSyncedFiles(updatedFiles);
      sessionStorage.setItem(SYNCED_FILES_KEY, JSON.stringify(updatedFiles));

      toast.success(`تم حفظ الملف محلياً: ${fileName}`);
      return true;
    } catch (error: any) {
      console.error('Save file error:', error);
      toast.error(`فشل حفظ الملف: ${error.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [directoryHandle, syncedFiles, requestFolderAccess]);

  /**
   * حفظ PDF من URL
   */
  const savePdfFromUrl = useCallback(async (
    url: string,
    fileName: string,
    subfolder?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await saveFileLocally(blob, fileName, subfolder, url);
    } catch (error) {
      console.error('Download and save error:', error);
      toast.error('فشل تحميل وحفظ الملف');
      return false;
    }
  }, [saveFileLocally]);

  /**
   * حفظ نسخة احتياطية JSON
   */
  const saveBackupLocally = useCallback(async (
    data: any,
    fileName: string = `backup-${new Date().toISOString().split('T')[0]}.json`
  ): Promise<boolean> => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return await saveFileLocally(blob, fileName, 'backups');
  }, [saveFileLocally]);

  /**
   * التحقق من حالة الاتصال بالمجلد
   */
  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (!directoryHandle) return false;
    
    try {
      // @ts-ignore
      const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
      return permission === 'granted';
    } catch {
      return false;
    }
  }, [directoryHandle]);

  /**
   * إلغاء الربط بالمجلد
   */
  const disconnectFolder = useCallback(() => {
    setDirectoryHandle(null);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.info('تم إلغاء ربط المجلد المحلي');
  }, []);

  return {
    isSupported,
    isConnected: !!directoryHandle,
    folderName: directoryHandle?.name || null,
    syncedFiles,
    isSaving,
    requestFolderAccess,
    saveFileLocally,
    savePdfFromUrl,
    saveBackupLocally,
    checkAccess,
    disconnectFolder,
  };
}

export default useLocalFileSync;
