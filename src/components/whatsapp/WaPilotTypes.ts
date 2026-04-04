/**
 * WaPilot Types — shared between WaPilot modular components
 */
export interface InstanceInfo {
  id: string;
  name?: string;
  status?: string;
  phone?: string;
  me?: { id?: string; pushName?: string };
  [key: string]: any;
}

export interface MessageLog {
  id: string;
  status: string;
  direction: string;
  message_type: string;
  created_at: string;
  organization_id: string | null;
  error_message: string | null;
  content: string | null;
  to_phone: string | null;
  from_phone: string | null;
  template_id: string | null;
  attachment_url: string | null;
  sent_by: string | null;
  meta_message_id: string | null;
  metadata: any;
  interactive_buttons: any;
  broadcast_group_id: string | null;
}

export interface OrgInfo {
  id: string;
  name: string;
  name_en?: string | null;
}

export interface WaPilotStats {
  totalMessages: number;
  sent: number;
  failed: number;
  pending: number;
  delivered: number;
  orgs: number;
  users: number;
  templates: number;
  campaigns: number;
  todayMessages: number;
  weekMessages: number;
}

export const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(var(--destructive))',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

/**
 * Parse WaPilot API messages into MessageLog format
 */
export const parseWaPilotMessages = (data: any): MessageLog[] => {
  if (!data) return [];
  const rawMessages = Array.isArray(data) ? data :
    (data?.data && Array.isArray(data.data)) ? data.data :
    (data?.messages && Array.isArray(data.messages)) ? data.messages : [];

  return rawMessages.map((msg: any, idx: number) => {
    const isFromMe = msg.fromMe ?? msg.from_me ?? (msg.key?.fromMe) ?? false;
    const remoteJid = msg.key?.remoteJid || msg.chatId || msg.chat_id || msg.from || msg.to || '';
    const phone = remoteJid.replace('@c.us', '').replace('@s.whatsapp.net', '').replace(/[\s\-\+]/g, '');
    const content = msg.body || msg.text || msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text || msg.content || '';
    const timestamp = msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() :
      msg.created_at || msg.messageTimestamp ? new Date((msg.messageTimestamp || 0) * 1000).toISOString() :
      new Date().toISOString();
    const msgId = msg.key?.id || msg.id || msg.message_id || `wapilot-${idx}-${Date.now()}`;

    return {
      id: `wapilot-api-${msgId}`,
      status: msg.ack === 3 ? 'read' : msg.ack === 2 ? 'delivered' : msg.ack === 1 ? 'sent' :
        msg.status || (isFromMe ? 'sent' : 'received'),
      direction: isFromMe ? 'outbound' : 'inbound',
      message_type: msg.type || (msg.hasMedia ? 'media' : 'text'),
      created_at: timestamp,
      organization_id: null,
      error_message: null,
      content: content || `[${msg.type || 'message'}]`,
      to_phone: isFromMe ? phone : null,
      from_phone: isFromMe ? null : phone,
      template_id: null,
      attachment_url: msg.mediaUrl || msg.media_url || null,
      sent_by: null,
      meta_message_id: msgId,
      metadata: {
        profile_name: msg.notifyName || msg.pushName || msg.senderName || msg.contact_name || null,
        source: 'wapilot_api',
        ack: msg.ack,
      },
      interactive_buttons: null,
      broadcast_group_id: null,
    } as MessageLog;
  }).filter((m: MessageLog) => {
    const phone = m.to_phone || m.from_phone || '';
    return phone.length >= 8 && !phone.includes('status');
  });
};
