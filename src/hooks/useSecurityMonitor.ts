/**
 * useSecurityMonitor — مراقب أمني لحظي للتطبيق
 * 
 * يراقب الأنشطة المشبوهة ويسجلها تلقائياً
 */
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { detectSQLInjection, detectPathTraversal } from '@/lib/inputSanitizer';

interface SecurityEvent {
  type: 'xss_attempt' | 'sql_injection' | 'path_traversal' | 'brute_force' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  metadata?: Record<string, any>;
}

// عداد محاولات فاشلة
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const BRUTE_FORCE_THRESHOLD = 5;
const BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function useSecurityMonitor() {
  const { user, profile } = useAuth();
  const monitoringRef = useRef(false);

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    console.warn(`[Security] ${event.severity.toUpperCase()}: ${event.type} — ${event.details}`);
    
    try {
      await supabase.from('activity_logs').insert({
        action: `security_${event.type}`,
        action_type: 'security_alert',
        user_id: user?.id || null,
        organization_id: profile?.organization_id || null,
        details: {
          severity: event.severity,
          description: event.details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ...event.metadata,
        } as any,
      });
    } catch {
      // Silent fail - don't expose security logging to attackers
    }
  }, [user?.id, profile?.organization_id]);

  // مراقبة محاولات تعديل DOM المشبوهة
  useEffect(() => {
    if (monitoringRef.current) return;
    monitoringRef.current = true;

    // مراقبة محاولات حقن سكريبتات
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLScriptElement && !node.src?.includes(window.location.origin)) {
            logSecurityEvent({
              type: 'xss_attempt',
              severity: 'critical',
              details: 'محاولة حقن سكريبت خارجي تم رصدها وحظرها',
              metadata: { scriptSrc: node.src?.substring(0, 100) },
            });
            node.remove();
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // مراقبة محاولات الوصول لـ localStorage بشكل مريب
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key: string, value: string) {
      if (detectSQLInjection(value) || detectPathTraversal(key)) {
        logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'high',
          details: 'محاولة تخزين بيانات مشبوهة في localStorage',
          metadata: { key: key.substring(0, 50) },
        });
        return;
      }
      originalSetItem(key, value);
    };

    return () => {
      observer.disconnect();
      localStorage.setItem = originalSetItem;
      monitoringRef.current = false;
    };
  }, [logSecurityEvent]);

  // تتبع محاولات تسجيل الدخول الفاشلة (brute force detection)
  const trackFailedLogin = useCallback((identifier: string) => {
    const now = Date.now();
    const entry = failedAttempts.get(identifier);

    if (!entry || now - entry.lastAttempt > BRUTE_FORCE_WINDOW_MS) {
      failedAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    entry.count += 1;
    entry.lastAttempt = now;

    if (entry.count >= BRUTE_FORCE_THRESHOLD) {
      logSecurityEvent({
        type: 'brute_force',
        severity: 'critical',
        details: `تم رصد ${entry.count} محاولات فاشلة لتسجيل الدخول`,
        metadata: { identifier: identifier.substring(0, 20), attempts: entry.count },
      });
      return true; // blocked
    }

    return false;
  }, [logSecurityEvent]);

  const clearFailedAttempts = useCallback((identifier: string) => {
    failedAttempts.delete(identifier);
  }, []);

  return {
    logSecurityEvent,
    trackFailedLogin,
    clearFailedAttempts,
  };
}
