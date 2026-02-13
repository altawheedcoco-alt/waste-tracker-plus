// Global event bus for opening/closing floating widgets
type WidgetId = 'ai-chat' | 'support' | 'operations' | 'team-chat' | 'create-shipment';

type WidgetEventHandler = (widgetId: WidgetId) => void;

const handlers = new Set<WidgetEventHandler>();

export const onWidgetToggle = (fn: WidgetEventHandler) => {
  handlers.add(fn);
  return () => { handlers.delete(fn); };
};

export const openWidget = (widgetId: WidgetId) => {
  handlers.forEach(fn => fn(widgetId));
};

export type { WidgetId };
