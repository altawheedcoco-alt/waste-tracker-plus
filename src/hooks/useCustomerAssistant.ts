import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
}

export const useCustomerAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shouldEscalate, setShouldEscalate] = useState(false);
  const { profile, organization } = useAuth();

  const sendMessage = useCallback(async (
    message: string,
    context?: { shipmentId?: string; ticketId?: string }
  ): Promise<AssistantResponse | null> => {
    setIsLoading(true);
    setShouldEscalate(false);

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-customer-assistant', {
        body: {
          message,
          conversationHistory: messages,
          userId: profile?.id,
          organizationId: organization?.id,
          context
        }
      });

      if (error) throw error;

      const response: AssistantResponse = data;
      
      // Add assistant message
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.reply };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update suggestions
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }

      // Check if needs escalation
      if (response.escalateToHuman) {
        setShouldEscalate(true);
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
  }, [messages, profile?.id, organization?.id]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSuggestions([]);
    setShouldEscalate(false);
  }, []);

  return {
    isLoading,
    messages,
    suggestions,
    shouldEscalate,
    sendMessage,
    clearChat
  };
};
