import { BaseRepository, QueryOptions } from './BaseRepository';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  shipment_id?: string;
  request_id?: string;
  pdf_url?: string;
  created_at: string;
}

class NotificationsRepositoryClass extends BaseRepository<Notification> {
  protected tableName = 'notifications';
  protected defaultSelect = '*';

  async findByUser(userId: string, options?: QueryOptions): Promise<Notification[]> {
    return this.findAll({
      ...options,
      filters: { ...options?.filters, user_id: userId },
      orderBy: options?.orderBy || { column: 'created_at', ascending: false },
    });
  }

  async findUnread(userId: string): Promise<Notification[]> {
    return this.findAll({
      filters: { user_id: userId, is_read: false },
      orderBy: { column: 'created_at', ascending: false },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { is_read: true } as Partial<Notification>);
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.table
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.count({ user_id: userId, is_read: false });
  }

  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    return this.create(notification as any);
  }

  async deleteOlderThan(userId: string, days: number): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await this.table
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate);

    if (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  async getRecent(userId: string, limit = 10): Promise<Notification[]> {
    return this.findByUser(userId, { limit });
  }
}

export const NotificationsRepository = new NotificationsRepositoryClass();
