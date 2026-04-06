import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export type ActionEngineState = 'idle' | 'processing' | 'waiting_input' | 'completed';

export interface ActionOption {
  id: string;
  label: string;
}

export interface ActionEngineResponse {
  type: 'ask_user' | 'navigate' | 'complete' | 'message' | 'error';
  message?: string;
  question?: string;
  field_name?: string;
  options?: ActionOption[];
  path?: string;
  success?: boolean;
  created_id?: string;
  next_suggestion?: string;
  conversation_state?: any[];
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export function useVoiceActionEngine() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [engineState, setEngineState] = useState<ActionEngineState>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentOptions, setCurrentOptions] = useState<ActionOption[]>([]);
  const [currentFieldName, setCurrentFieldName] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const [nextSuggestion, setNextSuggestion] = useState<string | null>(null);
  const conversationRef = useRef<ConversationMessage[]>([]);
  const isActiveRef = useRef(false);

  const resetEngine = useCallback(() => {
    setEngineState('idle');
    setCurrentQuestion(null);
    setCurrentOptions([]);
    setCurrentFieldName(null);
    setLastActionMessage(null);
    setNextSuggestion(null);
    conversationRef.current = [];
    isActiveRef.current = false;
  }, []);

  const processResponse = useCallback((response: ActionEngineResponse): string => {
    switch (response.type) {
      case 'ask_user':
        setEngineState('waiting_input');
        setCurrentQuestion(response.question || null);
        setCurrentOptions(response.options || []);
        setCurrentFieldName(response.field_name || null);
        if (response.conversation_state) {
          conversationRef.current = response.conversation_state;
        }
        isActiveRef.current = true;
        return response.question || 'محتاج بيانات إضافية يا باشا';

      case 'navigate':
        if (response.path) {
          navigate(response.path);
        }
        if (response.conversation_state) {
          conversationRef.current = response.conversation_state;
          isActiveRef.current = true;
          setEngineState('waiting_input');
        }
        return response.message || 'تم فتح الصفحة يا باشا';

      case 'complete':
        setEngineState('completed');
        setNextSuggestion(response.next_suggestion || null);
        setLastActionMessage(response.message || null);
        isActiveRef.current = false;
        if (response.success) {
          toast.success(response.message || 'تم التنفيذ بنجاح! ✅');
        } else {
          toast.error(response.message || 'حصلت مشكلة في التنفيذ');
        }
        return response.message || 'تم يا باشا';

      case 'message':
        // Check if this is still part of an action or just conversation
        if (!isActiveRef.current) {
          setEngineState('idle');
        }
        return response.message || '';

      case 'error':
        setEngineState('idle');
        isActiveRef.current = false;
        return response.message || 'حصلت مشكلة يا باشا';

      default:
        return response.message || '';
    }
  }, [navigate]);

  const sendToEngine = useCallback(async (userMessage: string, currentRoute: string): Promise<string> => {
    setEngineState('processing');

    // Add user message to conversation
    conversationRef.current.push({ role: 'user', content: userMessage });

    try {
      const { data, error } = await supabase.functions.invoke('voice-action-engine', {
        body: {
          messages: conversationRef.current,
          userRole: organization?.organization_type || 'user',
          organizationId: organization?.id,
          userId: user?.id,
          currentRoute,
        },
      });

      if (error) throw error;

      const response = data as ActionEngineResponse;
      const responseText = processResponse(response);

      // Add assistant response to conversation history
      if (response.type !== 'ask_user') {
        conversationRef.current.push({ role: 'assistant', content: responseText });
      }

      return responseText;
    } catch (err) {
      console.error('Action engine error:', err);
      setEngineState('idle');
      isActiveRef.current = false;
      return 'معلش يا باشا حصلت مشكلة، حاول تاني';
    }
  }, [user, organization, processResponse]);

  // Detect if a user message is an "action command" vs simple navigation/chat
  const isActionCommand = useCallback((text: string): boolean => {
    const actionPatterns = [
      /أنشئ|انشئ|اعمل|سجل|ضيف|أضف/,
      /عيّن|حط|خصص|وزع/,
      /حدّث|غيّر|عدّل/,
      /احذف|الغي|شيل/,
      /اعرض.*(شحنات|فواتير|سائقين|جهات)/,
      /كم.*(شحنة|فاتورة|سائق)/,
      /إحصائيات|ملخص|تقرير/,
      /شحنة جديدة|فاتورة جديدة/,
      /عايز أعمل|عايز أنشئ|عايز أضيف/,
      /سواق.*شحنة|شحنة.*سواق/,
    ];
    return actionPatterns.some(p => p.test(text));
  }, []);

  return {
    engineState,
    currentQuestion,
    currentOptions,
    currentFieldName,
    lastActionMessage,
    nextSuggestion,
    isActionActive: isActiveRef.current,
    sendToEngine,
    isActionCommand,
    resetEngine,
  };
}
