// Global event bus for triggering AI chatbot with pre-filled messages
type ChatEventHandler = (message: string) => void;

let handler: ChatEventHandler | null = null;

export const registerAIChatHandler = (fn: ChatEventHandler) => {
  handler = fn;
};

export const unregisterAIChatHandler = () => {
  handler = null;
};

export const triggerAIChat = (message: string) => {
  if (handler) {
    handler(message);
  }
};
