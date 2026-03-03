import { supabase } from './client';

/**
 * Audit Service
 * 
 * Provides functions for working with audit logs stored in the audit_logs table.
 * The table is automatically populated by PostgreSQL triggers on INSERT/UPDATE/DELETE operations.
 * 
 * Usage:
 * - To add context to an operation: call setAuditContext() before performing the DB operation
 * - To fetch audit logs: call getAuditLogs() with optional filters
 */

export const auditService = {
  /**
   * Prepares context metadata for an upcoming database operation.
   * Note: In the current implementation, triggers automatically capture all changes.
   * The context parameter here is for future use when integrating with server-side
   * functions that can set PostgreSQL session variables.
   * 
   * @param {string} actionType - The type of action (e.g., 'edit_queue', 'approve_request')
   * @param {object} metadata - Additional metadata to store (optional)
   * @returns {object} Context object that can be passed along with mutations
   * 
   * Example:
   * const context = auditService.prepareContext('edit_queue', { reason: 'player_name_typo' });
   * // In future: pass context to mutation for richer audit trails
   */
  prepareContext(actionType, metadata = {}) {
    return {
      action_type: actionType,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  },

  /**
   * Fetches audit logs with optional filters
   * 
   * @param {object} options - Filter options
   * @param {string} [options.tableNames] - Comma-separated table names to filter by
   * @param {string} [options.actorId] - User ID to filter by
   * @param {string} [options.operation] - Operation type (INSERT, UPDATE, DELETE)
   * @param {string} [options.recordId] - Specific record ID
   * @param {Date} [options.fromDate] - Start date for time range
   * @param {Date} [options.toDate] - End date for time range
   * @param {number} [options.limit] - Number of records to return (default: 100)
   * @param {number} [options.offset] - Pagination offset (default: 0)
   * @returns {Promise<{data: Array, count: number, error: Error|null}>}
   */
  async getAuditLogs(options = {}) {
    try {
      const {
        tableNames = null,
        actorId = null,
        operation = null,
        recordId = null,
        fromDate = null,
        toDate = null,
        limit = 100,
        offset = 0
      } = options;

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (tableNames) {
        const tables = Array.isArray(tableNames) ? tableNames : [tableNames];
        query = query.in('table_name', tables);
      }
      if (actorId) {
        query = query.eq('actor_id', actorId);
      }
      if (operation) {
        query = query.eq('operation', operation);
      }
      if (recordId) {
        query = query.eq('record_id', recordId);
      }
      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }
      if (toDate) {
        query = query.lte('created_at', toDate.toISOString());
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, count, error: null };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Fetches a single audit log entry
   * 
   * @param {string} logId - The audit log ID
   * @returns {Promise<{data: object, error: Error|null}>}
   */
  async getAuditLog(logId) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return { data: null, error };
    }
  },

  /**
   * Fetches audit logs for a specific entity (e.g., all changes to a queue entry)
   * 
   * @param {string} recordId - The record ID (e.g., queue entry UUID)
   * @param {string} [tableName] - Optional table name filter
   * @returns {Promise<{data: Array, error: Error|null}>}
   */
  async getAuditTrailForEntity(recordId, tableName = null) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: true });

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching entity audit trail:', error);
      return { data: [], error };
    }
  },

  /**
   * Exports audit logs to CSV format
   * 
   * @param {Array} auditLogs - Array of audit log entries
   * @returns {string} CSV content
   */
  exportToCSV(auditLogs) {
    if (!auditLogs || auditLogs.length === 0) {
      return 'No audit logs to export';
    }

    const headers = [
      'ID',
      'Table',
      'Operation',
      'Record ID',
      'Actor ID',
      'Created At',
      'Action Type',
      'Changes Summary'
    ];

    const rows = auditLogs.map(log => {
      const getActionType = () => {
        if (log.context?.action_type) return log.context.action_type;
        return `${log.operation}_${log.table_name}`;
      };

      const getChangesSummary = () => {
        if (log.operation === 'INSERT') {
          return 'New record created';
        } else if (log.operation === 'DELETE') {
          return 'Record deleted';
        } else if (log.operation === 'UPDATE' && log.old_values && log.new_values) {
          const oldKeys = Object.keys(log.old_values);
          const changes = oldKeys
            .filter(key => log.old_values[key] !== log.new_values[key])
            .map(key => `${key}: ${log.old_values[key]} → ${log.new_values[key]}`)
            .slice(0, 3); // Limit to 3 changes in summary
          return changes.length > 0 ? changes.join('; ') : 'No visible changes';
        }
        return '';
      };

      return [
        log.id,
        log.table_name,
        log.operation,
        log.record_id,
        log.actor_id || 'System',
        new Date(log.created_at).toISOString(),
        getActionType(),
        getChangesSummary()
      ];
    });

    // Escape CSV values
    const escapeCsvValue = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    return csvContent;
  }
};
