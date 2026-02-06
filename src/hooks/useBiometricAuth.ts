import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  device_name: string;
  biometric_type: 'fingerprint' | 'face' | 'iris' | 'unknown';
  created_at: string;
  last_used_at: string | null;
}

export interface BiometricVerificationResult {
  success: boolean;
  credentialId?: string;
  biometricType?: string;
  verificationId?: string;
  timestamp: string;
  deviceInfo?: string;
  error?: string;
}

// Check if WebAuthn is supported
export const isBiometricSupported = (): boolean => {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function'
  );
};

// Check if platform authenticator (built-in biometrics) is available
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isBiometricSupported()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// Generate a random challenge
const generateChallenge = (): ArrayBuffer => {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer as ArrayBuffer;
};

// Convert ArrayBuffer to base64url
const bufferToBase64url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Convert base64url to ArrayBuffer
const base64urlToBuffer = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

// Detect biometric type from authenticator data
const detectBiometricType = (): 'fingerprint' | 'face' | 'iris' | 'unknown' => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('iphone') || ua.includes('ipad')) {
    return 'face';
  } else if (ua.includes('mac')) {
    return 'fingerprint';
  } else if (ua.includes('android')) {
    return 'fingerprint';
  } else if (ua.includes('windows')) {
    return 'face';
  }
  
  return 'unknown';
};

// Get device name for display
const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Android')) return 'Android Device';
  if (ua.includes('Linux')) return 'Linux Device';
  
  return 'Unknown Device';
};

// Convert string to ArrayBuffer for user.id
const stringToBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(str);
  return encoded.buffer as ArrayBuffer;
};

export function useBiometricAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);

  // Check biometric support
  const checkSupport = useCallback(async () => {
    const supported = await isPlatformAuthenticatorAvailable();
    setIsSupported(supported);
    return supported;
  }, []);

  // Register a new biometric credential
  const registerBiometric = useCallback(async (
    userId: string,
    userName: string,
    displayName: string
  ): Promise<{ success: boolean; credentialId?: string; error?: string }> => {
    setIsLoading(true);
    
    try {
      if (!isBiometricSupported()) {
        throw new Error('المتصفح لا يدعم المصادقة البيومترية');
      }

      const challenge = generateChallenge();
      const userIdBuffer = stringToBuffer(userId);
      
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'I-Recycle Platform',
          id: window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: userName,
          displayName: displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('فشل في إنشاء بيانات الاعتماد');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = bufferToBase64url(credential.rawId);
      const publicKeyBuffer = response.getPublicKey();
      const publicKey = publicKeyBuffer ? bufferToBase64url(publicKeyBuffer) : '';
      const biometricType = detectBiometricType();
      const deviceName = getDeviceName();

      // Store credential in database
      const { error: dbError } = await supabase
        .from('biometric_credentials')
        .insert({
          user_id: userId,
          credential_id: credentialId,
          public_key: publicKey,
          device_name: deviceName,
          biometric_type: biometricType,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('فشل في حفظ بيانات الاعتماد');
      }

      toast.success('تم تسجيل البصمة بنجاح');
      
      return {
        success: true,
        credentialId,
      };
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      
      let errorMessage = 'فشل في تسجيل البصمة';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'تم رفض طلب المصادقة البيومترية';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'الجهاز لا يدعم هذا النوع من المصادقة';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify biometric for signing
  const verifyBiometric = useCallback(async (
    userId: string,
    purpose: string = 'توقيع مستند'
  ): Promise<BiometricVerificationResult> => {
    setIsLoading(true);
    
    try {
      if (!isBiometricSupported()) {
        throw new Error('المتصفح لا يدعم المصادقة البيومترية');
      }

      // Get user's registered credentials
      const { data: storedCredentials, error: fetchError } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;
      
      if (!storedCredentials || storedCredentials.length === 0) {
        throw new Error('لا توجد بصمات مسجلة. يرجى تسجيل بصمتك أولاً.');
      }

      const challenge = generateChallenge();
      
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: storedCredentials.map(cred => ({
          id: base64urlToBuffer(cred.credential_id),
          type: 'public-key' as const,
          transports: ['internal'] as AuthenticatorTransport[],
        })),
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('فشل في التحقق من البصمة');
      }

      const credentialIdFromAssertion = bufferToBase64url(assertion.rawId);
      const matchedCredential = storedCredentials.find(
        c => c.credential_id === credentialIdFromAssertion
      );

      if (!matchedCredential) {
        throw new Error('البصمة غير معروفة');
      }

      // Update last used timestamp
      await supabase
        .from('biometric_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', matchedCredential.id);

      // Log the verification
      await supabase
        .from('biometric_verifications')
        .insert({
          user_id: userId,
          credential_id: matchedCredential.id,
          purpose,
          success: true,
          device_info: getDeviceName(),
        });

      toast.success('تم التحقق من البصمة بنجاح');

      return {
        success: true,
        credentialId: matchedCredential.id,
        biometricType: matchedCredential.biometric_type,
        verificationId: `bio-${Date.now()}-${matchedCredential.id.slice(0, 8)}`,
        timestamp: new Date().toISOString(),
        deviceInfo: getDeviceName(),
      };
    } catch (error: any) {
      console.error('Biometric verification error:', error);
      
      let errorMessage = 'فشل في التحقق من البصمة';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'تم رفض طلب المصادقة البيومترية أو انتهت المهلة';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'الجهاز لا يدعم هذا النوع من المصادقة';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Log failed attempt
      try {
        await supabase
          .from('biometric_verifications')
          .insert({
            user_id: userId,
            purpose,
            success: false,
            error_message: errorMessage,
            device_info: getDeviceName(),
          });
      } catch (logError) {
        console.error('Failed to log verification attempt:', logError);
      }

      toast.error(errorMessage);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user's credentials
  const loadCredentials = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedCredentials: BiometricCredential[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        credential_id: item.credential_id,
        public_key: item.public_key,
        device_name: item.device_name,
        biometric_type: item.biometric_type as 'fingerprint' | 'face' | 'iris' | 'unknown',
        created_at: item.created_at,
        last_used_at: item.last_used_at,
      }));
      
      setCredentials(mappedCredentials);
      return mappedCredentials;
    } catch (error) {
      console.error('Error loading credentials:', error);
      return [];
    }
  }, []);

  // Delete a credential
  const deleteCredential = useCallback(async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('biometric_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;
      
      setCredentials(prev => prev.filter(c => c.id !== credentialId));
      toast.success('تم حذف البصمة بنجاح');
      return true;
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast.error('فشل في حذف البصمة');
      return false;
    }
  }, []);

  return {
    isLoading,
    isSupported,
    credentials,
    checkSupport,
    registerBiometric,
    verifyBiometric,
    loadCredentials,
    deleteCredential,
    isBiometricSupported,
    isPlatformAuthenticatorAvailable,
  };
}
