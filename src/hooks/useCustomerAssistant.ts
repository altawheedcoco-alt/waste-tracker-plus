import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
  created_at?: string;
}

interface AssistantResponse {
  reply: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    data?: any;
  }>;
  escalateToHuman?: boolean;
  ticketId?: string;
}

interface ConversationData {
  id: string;
  status: 'active' | 'closed' | 'escalated';
  started_at: string;
  rating?: number;
  rating_feedback?: string;
}

export const useCustomerAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shouldEscalate, setShouldEscalate] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [showRating, setShowRating] = useState(false);
  const { profile, organization } = useAuth();

  // تحميل المحادثة النشطة عند البداية
  useEffect(() => {
    if (profile?.id) {
      loadActiveConversation();
    }
  }, [profile?.id]);

  const loadActiveConversation = async () => {
    try {
      // البحث عن محادثة نشطة
      const { data: activeConv, error: convError } = await supabase
        .from('customer_conversations')
        .select('*')
        .eq('user_id', profile?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (convError) throw convError;

      if (activeConv) {
        setConversationId(activeConv.id);
        setConversation(activeConv as ConversationData);

        // تحميل الرسائل السابقة
        const { data: msgs, error: msgsError } = await supabase
          .from('customer_conversation_messages')
          .select('*')
          .eq('conversation_id', activeConv.id)
          .order('created_at', { ascending: true });

        if (msgsError) throw msgsError;

        if (msgs) {
          setMessages(msgs.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            suggestions: m.suggestions as string[] | undefined,
            actions: m.actions as ChatMessage['actions'] | undefined,
            created_at: m.created_at
          })));

          // تحميل آخر اقتراحات
          const lastAssistant = msgs.filter(m => m.role === 'assistant').pop();
          if (lastAssistant?.suggestions) {
            setSuggestions(lastAssistant.suggestions as string[]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  const startNewConversation = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('customer_conversations')
        .insert({
          user_id: profile?.id,
          organization_id: organization?.id,
          status: 'active',
          context: {}
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(data.id);
      setConversation(data as ConversationData);
      return data.id;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  };

  const saveMessage = async (
    convId: string,
    role: 'user' | 'assistant',
    content: string,
    suggestions?: string[],
    actions?: ChatMessage['actions']
  ) => {
    try {
      const { data, error } = await supabase
        .from('customer_conversation_messages')
        .insert({
          conversation_id: convId,
          role,
          content,
          suggestions: suggestions || null,
          actions: actions || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving message:', err);
      return null;
    }
  };

  const sendMessage = useCallback(async (
    message: string,
    context?: { shipmentId?: string; ticketId?: string }
  ): Promise<AssistantResponse | null> => {
    setIsLoading(true);
    setShouldEscalate(false);

    try {
      // إنشاء محادثة جديدة إذا لم تكن موجودة
      let convId = conversationId;
      if (!convId) {
        convId = await startNewConversation();
        if (!convId) throw new Error('Failed to create conversation');
      }

      // حفظ رسالة المستخدم
      const userMessage: ChatMessage = { role: 'user', content: message };
      setMessages(prev => [...prev, userMessage]);
      await saveMessage(convId, 'user', message);

      // إرسال للـ AI
      const { data, error } = await supabase.functions.invoke('ai-customer-assistant', {
        body: {
          message,
          conversationHistory: messages,
          userId: profile?.id,
          organizationId: organization?.id,
          conversationId: convId,
          context
        }
      });

      if (error) throw error;

      const response: AssistantResponse = data;
      
      // حفظ رد المساعد
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response.reply,
        suggestions: response.suggestions,
        actions: response.actions
      };
      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(convId, 'assistant', response.reply, response.suggestions, response.actions);
      
      // تحديث الاقتراحات
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }

      // التحقق من التصعيد
      if (response.escalateToHuman) {
        setShouldEscalate(true);
        
        // تحديث حالة المحادثة
        await supabase
          .from('customer_conversations')
          .update({ 
            status: 'escalated',
            escalated_at: new Date().toISOString(),
            escalated_to_ticket_id: response.ticketId || null
          })
          .eq('id', convId);

        if (response.ticketId) {
          toast.success('تم إنشاء تذكرة دعم وسيتواصل معك فريقنا قريباً');
        }
      }

      return response;
    } catch (err) {
      console.error('Customer assistant error:', err);
      
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' 
      };
      setMessages(prev => [...prev, errorMessage]);
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, profile?.id, organization?.id, conversationId]);

  const endConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await supabase
        .from('customer_conversations')
        .update({ 
          status: 'closed',
          ended_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      setShowRating(true);
    } catch (err) {
      console.error('Error ending conversation:', err);
    }
  }, [conversationId]);

  const submitRating = useCallback(async (rating: number, feedback?: string) => {
    if (!conversationId) return;

    try {
      await supabase
        .from('customer_conversations')
        .update({ 
          rating,
          rating_feedback: feedback || null,
          rated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      toast.success('شكراً لتقييمك!');
      setShowRating(false);
      
      // إعادة تعيين الحالة
      setConversationId(null);
      setConversation(null);
      setMessages([]);
      setSuggestions([]);
    } catch (err) {
      console.error('Error submitting rating:', err);
      toast.error('حدث خطأ في حفظ التقييم');
    }
  }, [conversationId]);

  const clearChat = useCallback(async () => {
    if (conversationId && messages.length > 0) {
      await endConversation();
    } else {
      setMessages([]);
      setSuggestions([]);
      setShouldEscalate(false);
      setConversationId(null);
      setConversation(null);
    }
  }, [conversationId, messages.length, endConversation]);

  return {
    isLoading,
    messages,
    suggestions,
    shouldEscalate,
    conversationId,
    conversation,
    showRating,
    sendMessage,
    clearChat,
    endConversation,
    submitRating,
    setShowRating
  };
};
