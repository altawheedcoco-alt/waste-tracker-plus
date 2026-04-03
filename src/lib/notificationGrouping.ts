/**
 * Notification Grouping Engine — تجميع الإشعارات المتشابهة
 * مثل: "أحمد و5 آخرين أعجبوا بمنشورك"
 */

interface RawNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
  priority?: string | null;
  shipment_id?: string | null;
  request_id?: string | null;
  pdf_url?: string | null;
  metadata?: any;
  [key: string]: any;
}

export interface GroupedNotification {
  /** ID of the latest notification in the group */
  id: string;
  /** All notification IDs in this group */
  ids: string[];
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
  priority?: string | null;
  shipment_id?: string | null;
  request_id?: string | null;
  pdf_url?: string | null;
  metadata?: any;
  /** Number of notifications merged */
  count: number;
  /** Whether this is a grouped notification */
  isGrouped: boolean;
  /** Original notifications (for expansion) */
  children: RawNotification[];
}

// Types that can be grouped together
const GROUPABLE_TYPES: Record<string, { groupKey: (n: RawNotification) => string; summaryTemplate: (count: number, latest: RawNotification) => string }> = {
  post_liked: {
    groupKey: (n) => `post_liked_${n.metadata?.post_id || n.request_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${latest.message?.split(' ')[0] || 'شخص'} و${count - 1} آخرين أعجبوا بمنشورك` : latest.message,
  },
  post_commented: {
    groupKey: (n) => `post_commented_${n.metadata?.post_id || n.request_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${latest.message?.split(' ')[0] || 'شخص'} و${count - 1} آخرين علقوا على منشورك` : latest.message,
  },
  post_shared: {
    groupKey: (n) => `post_shared_${n.metadata?.post_id || n.request_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${latest.message?.split(' ')[0] || 'شخص'} و${count - 1} آخرين شاركوا منشورك` : latest.message,
  },
  story_reaction: {
    groupKey: (n) => `story_reaction_${n.metadata?.story_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} تفاعل على قصتك` : latest.message,
  },
  reaction_added: {
    groupKey: (n) => `reaction_${n.metadata?.message_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} تفاعل على رسالتك` : latest.message,
  },
  partnership_request: {
    groupKey: () => 'partnership_requests',
    summaryTemplate: (count, latest) => count > 1 ? `${count} طلبات شراكة جديدة` : latest.message,
  },
  driver_registered: {
    groupKey: () => 'driver_registrations',
    summaryTemplate: (count, latest) => count > 1 ? `${count} سائقين جدد مسجلين` : latest.message,
  },
  new_post: {
    groupKey: () => 'new_posts',
    summaryTemplate: (count, latest) => count > 1 ? `${count} منشورات جديدة` : latest.message,
  },
  broadcast_new_post: {
    groupKey: (n) => `broadcast_${n.metadata?.channel_id || 'all'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} منشورات جديدة في القناة` : latest.message,
  },
  chat_message: {
    groupKey: (n) => `chat_${n.metadata?.conversation_id || n.metadata?.sender_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} رسائل جديدة` : latest.message,
  },
  message: {
    groupKey: (n) => `msg_${n.metadata?.conversation_id || n.metadata?.sender_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} رسائل جديدة` : latest.message,
  },
  shipment_status: {
    groupKey: (n) => `shipment_status_${n.shipment_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} تحديثات على الشحنة` : latest.message,
  },
  shipment_status_change: {
    groupKey: (n) => `shipment_change_${n.shipment_id || 'unknown'}`,
    summaryTemplate: (count, latest) => count > 1 ? `${count} تحديثات على الشحنة` : latest.message,
  },
};

// Time window for grouping (in ms) — group notifications within 24 hours of each other
const GROUP_TIME_WINDOW = 24 * 60 * 60 * 1000;

export function groupNotifications(notifications: RawNotification[]): GroupedNotification[] {
  const groups = new Map<string, RawNotification[]>();
  const ungrouped: RawNotification[] = [];

  for (const n of notifications) {
    const type = n.type || '';
    const config = GROUPABLE_TYPES[type];

    if (config) {
      const key = config.groupKey(n);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(n);
    } else {
      ungrouped.push(n);
    }
  }

  const result: GroupedNotification[] = [];

  // Process groups
  for (const [, items] of groups) {
    if (items.length === 1) {
      // Single item — no grouping needed
      result.push(toGrouped(items[0]));
      continue;
    }

    // Sort by created_at descending
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Sub-group by time window
    const timeGroups: RawNotification[][] = [];
    let currentGroup: RawNotification[] = [items[0]];

    for (let i = 1; i < items.length; i++) {
      const timeDiff = new Date(currentGroup[0].created_at).getTime() - new Date(items[i].created_at).getTime();
      if (timeDiff <= GROUP_TIME_WINDOW) {
        currentGroup.push(items[i]);
      } else {
        timeGroups.push(currentGroup);
        currentGroup = [items[i]];
      }
    }
    timeGroups.push(currentGroup);

    for (const group of timeGroups) {
      if (group.length === 1) {
        result.push(toGrouped(group[0]));
      } else {
        const latest = group[0];
        const config = GROUPABLE_TYPES[latest.type || ''];
        const summaryMessage = config ? config.summaryTemplate(group.length, latest) : latest.message;
        const allRead = group.every(n => n.is_read);

        result.push({
          id: latest.id,
          ids: group.map(n => n.id),
          title: latest.title,
          message: summaryMessage,
          type: latest.type,
          is_read: allRead,
          created_at: latest.created_at,
          priority: latest.priority,
          shipment_id: latest.shipment_id,
          request_id: latest.request_id,
          pdf_url: latest.pdf_url,
          metadata: latest.metadata,
          count: group.length,
          isGrouped: true,
          children: group,
        });
      }
    }
  }

  // Add ungrouped
  for (const n of ungrouped) {
    result.push(toGrouped(n));
  }

  // Sort final result by created_at descending
  result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return result;
}

function toGrouped(n: RawNotification): GroupedNotification {
  return {
    id: n.id,
    ids: [n.id],
    title: n.title,
    message: n.message,
    type: n.type,
    is_read: n.is_read,
    created_at: n.created_at,
    priority: n.priority,
    shipment_id: n.shipment_id,
    request_id: n.request_id,
    pdf_url: n.pdf_url,
    metadata: n.metadata,
    count: 1,
    isGrouped: false,
    children: [n],
  };
}
