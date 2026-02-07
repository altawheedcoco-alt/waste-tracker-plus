import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAIDocumentClassifier, ClassificationResult } from '@/hooks/useAIDocumentClassifier';

interface SmartDocumentUploadProps {
  onClassified?: (result: ClassificationResult, file: File) => void;
  onUpload?: (file: File, classification: ClassificationResult) => Promise<void>;
  acceptedTypes?: string;
  maxSizeMB?: number;
}

const SmartDocumentUpload = ({
  onClassified,
  onUpload,
  acceptedTypes = "image/*,application/pdf",
  maxSizeMB = 10
}: SmartDocumentUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { isClassifying, classifyDocument, getDocumentTypeLabel } = useAIDocumentClassifier();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);
    setClassification(null);

    // Classify the document
    const result = await classifyDocument(file);
    if (result) {
      setClassification(result);
      onClassified?.(result, file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !classification || !onUpload) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      await onUpload(selectedFile, classification);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setClassification(null);
    setUploadProgress(0);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          رفع مستند ذكي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept={acceptedTypes}
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">اسحب المستند هنا أو انقر للاختيار</p>
              <p className="text-sm text-muted-foreground">
                الذكاء الاصطناعي سيقوم بتصنيف المستند واستخراج البيانات تلقائياً
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                الحد الأقصى: {maxSizeMB} ميجابايت
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={reset}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Classification Status */}
              {isClassifying && (
                <div className="flex items-center justify-center gap-3 p-6 bg-primary/5 rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>جاري تحليل المستند بالذكاء الاصطناعي...</span>
                </div>
              )}

              {/* Classification Result */}
              {classification && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-700 dark:text-green-300">
                        تم تصنيف المستند بنجاح
                      </span>
                    </div>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">نوع المستند:</span>
                        <Badge variant="secondary">
                          {getDocumentTypeLabel(classification.document_type)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">درجة الثقة:</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(classification.confidence)}`} />
                          <span className="font-medium">{classification.confidence}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">المجلد المقترح:</span>
                        <span className="text-sm">{classification.suggested_folder}</span>
                      </div>

                      {classification.tags.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground block mb-2">الوسوم:</span>
                          <div className="flex flex-wrap gap-1">
                            {classification.tags.map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {classification.summary && (
                        <div>
                          <span className="text-sm text-muted-foreground block mb-1">الملخص:</span>
                          <p className="text-sm">{classification.summary}</p>
                        </div>
                      )}

                      {Object.keys(classification.extracted_data).length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground block mb-2">البيانات المستخرجة:</span>
                          <div className="bg-background rounded-lg p-3 text-sm space-y-1">
                            {Object.entries(classification.extracted_data).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Button */}
                  {onUpload && (
                    <div className="space-y-2">
                      {isUploading && (
                        <Progress value={uploadProgress} className="h-2" />
                      )}
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            جاري الرفع... {uploadProgress}%
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 ml-2" />
                            رفع المستند
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default SmartDocumentUpload;
