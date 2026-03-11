import { supabase } from './client';
import { validateData, contactReportSchema } from '../../utils/validation';
import { TABLES, BUCKETS } from '../../constants/database';

// Contact service functions
export const contactService = {
  // Submit a new report
  async submitReport({ report_type, description, email, user_id, file }) {
    const validationPayload = { report_type, description, email };
    
    const textValidation = validateData(contactReportSchema.omit({ file: true }), validationPayload);
    if (!textValidation.success) throw new Error(textValidation.error);

    if (file) {
        const fileValidation = validateData(contactReportSchema.pick({ file: true }), { file });
        if (!fileValidation.success) throw new Error(fileValidation.error);
    }

    let attachment_path = null;
    let attachment_name = null;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKETS.CONTACT_UPLOADS)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        
        attachment_path = filePath;
        attachment_name = file.name;
    }

    const { data, error } = await supabase
      .from(TABLES.CONTACT_REPORTS)
      .insert([{
        report_type,
        description,
        email,
        user_id,
        status: 'open',
        attachment_path,
        attachment_name
      }]);

    if (error) throw error;
    return data;
  },

  // Get all reports (for admin)
  async getReports() {
    const { data: reports, error } = await supabase
      .from(TABLES.CONTACT_REPORTS)
      .select('id, report_type, description, email, user_id, status, attachment_path, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!reports || reports.length === 0) return [];

    const userIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))];
    let userMap = {};

    if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
            .from(TABLES.USER_ROLES)
            .select('user_id, display_name, email')
            .in('user_id', userIds);
        
        if (!userError && users) {
            users.forEach(u => { userMap[u.user_id] = u; });
        }
    }

    return reports.map(report => {
       const user = report.user_id ? userMap[report.user_id] : null;
       return {
           ...report,
           user_display: user ? user.display_name : 'Guest',
           user_email: user ? user.email : report.email
       };
    });
  },
  
  // Update report status
  async updateReportStatus(id, status) {
    const { data, error } = await supabase
        .from(TABLES.CONTACT_REPORTS)
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
  },

  // Get signed URL for attachment
  async getAttachmentUrl(path) {
      if (!path) return null;
      const { data, error } = await supabase.storage
          .from(BUCKETS.CONTACT_UPLOADS)
          .createSignedUrl(path, 60 * 60);
      
      if (error) throw error;
      return data.signedUrl;
  },

  // Delete report and its attachment
  async deleteReport(id, attachmentPath) {
      if (attachmentPath) {
          const { error: storageError } = await supabase.storage
              .from(BUCKETS.CONTACT_UPLOADS)
              .remove([attachmentPath]);
          
          if (storageError) {
              console.error('Failed to delete attachment:', storageError);
          }
      }

      const { error } = await supabase
          .from(TABLES.CONTACT_REPORTS)
          .delete()
          .eq('id', id);

      if (error) throw error;
  }
};

// Notification service functions
export const notificationService = {
  // Get all notifications for a user
  async getAllNotifications(userId) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: notifications, error: notifError } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .select('id, type, title, message, created_at')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false });

    if (notifError) throw notifError;

    if (!notifications || notifications.length === 0) return [];

    let readIds = new Set();
    if (userId) {
        const { data: reads, error: readError } = await supabase
            .from(TABLES.USER_NOTIFICATION_READS)
            .select('notification_id')
            .eq('user_id', userId);
        
        if (readError) throw readError;
        
        if (reads) {
            reads.forEach(r => readIds.add(r.notification_id));
        }
    }

    return notifications.map(n => ({
        ...n,
        read: readIds.has(n.id)
    }));
  },

  // Mark a notification as read
  async markAsRead(userId, notificationId) {
      if (!userId) return;
      
      const { error } = await supabase
        .from(TABLES.USER_NOTIFICATION_READS)
        .upsert(
            { user_id: userId, notification_id: notificationId },
            { onConflict: 'user_id, notification_id', ignoreDuplicates: true }
        );

      if (error) throw error;
  }
};
