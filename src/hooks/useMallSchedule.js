import { useEffect, useMemo, useState } from 'react';
import { scheduleService } from '../services/supabase';

// Helper: parse 'HH:MM' into minutes since midnight
const parseTimeToMinutes = (hhmm) => {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

// Helper: get Asia/Manila current parts (weekday, hour, minute)
const getManilaParts = (date) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour12: false,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return {
    weekday: map.weekday,
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
};

// Helper: get Manila parts for arbitrary ISO datetime
const getManilaPartsFromISO = (iso) => getManilaParts(new Date(iso));

export const useMallSchedule = (branchId) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await scheduleService.getSchedule(branchId);
        setSchedule(rows);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Only load if branchId is available
    if (branchId) {
      load();
    }
  }, [branchId]);

  // Map schedule by day for quick lookup
  const scheduleMap = useMemo(() => {
    const map = new Map();
    for (const row of schedule) {
      map.set(row.day, {
        openMinutes: parseTimeToMinutes(row.time_open),
        closeMinutes: parseTimeToMinutes(row.time_close),
      });
    }
    return map;
  }, [schedule]);

  // Compute mall open state for current Manila time
  const isMallOpen = useMemo(() => {
    const { weekday, hour, minute } = getManilaParts(new Date());
    const config = scheduleMap.get(weekday);
    if (!config || config.openMinutes == null || config.closeMinutes == null) return false;
    const nowMinutes = hour * 60 + minute;
    return nowMinutes >= config.openMinutes && nowMinutes < config.closeMinutes;
  }, [scheduleMap]);

  // Filter queue entries to those created within operating hours of their creation day
  const filterQueueByOperatingHours = (queue) => {
    if (!Array.isArray(queue) || queue.length === 0) return [];
    return queue.filter(item => {
      if (!item.created_at) return false; // require created_at to validate operating hours
      const parts = getManilaPartsFromISO(item.created_at);
      const config = scheduleMap.get(parts.weekday);
      if (!config || config.openMinutes == null || config.closeMinutes == null) return false;
      const minutes = parts.hour * 60 + parts.minute;
      return minutes >= config.openMinutes && minutes < config.closeMinutes;
    });
  };

  return {
    loading,
    error,
    schedule,
    isMallOpen,
    filterQueueByOperatingHours,
  };
};
