import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { StudyActivityType } from '@/types';

interface UseStudyTrackerOptions {
  activityType: StudyActivityType;
  title?: string;
  enabled?: boolean;
}

export const MIN_STUDY_DURATION_SECONDS = 60; // Minimal 1 menit sesuai ketentuan

export function useStudyTracker({
  activityType,
  title,
  enabled = true,
}: UseStudyTrackerOptions) {
  const { profile } = useAuthStore();
  const userId = profile?.id;

  const accumulatedSecondsRef = useRef<number>(0);
  const lastActiveTimestampRef = useRef<number | null>(null);
  const isSavedRef = useRef<boolean>(false);
  const optionsRef = useRef({ activityType, title, userId });

  // Update latest options reference
  optionsRef.current = { activityType, title, userId };

  // Helper to record duration when leaving active state
  const pauseTimer = useCallback(() => {
    if (lastActiveTimestampRef.current !== null) {
      const elapsed = (Date.now() - lastActiveTimestampRef.current) / 1000;
      accumulatedSecondsRef.current += Math.max(0, elapsed);
      lastActiveTimestampRef.current = null;
    }
  }, []);

  // Helper to resume active timer
  const resumeTimer = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      lastActiveTimestampRef.current = Date.now();
    }
  }, []);

  // Function to save accumulated study session (hanya kirim 1 request jika >= 60 detik)
  const flushSession = useCallback(async () => {
    if (isSavedRef.current) return;

    pauseTimer();
    const finalSeconds = Math.floor(accumulatedSecondsRef.current);
    const { activityType: actType, title: actTitle, userId: uid } = optionsRef.current;

    // Hanya simpan jika durasi belajar minimal 1 menit (60 detik)
    if (!uid || finalSeconds < MIN_STUDY_DURATION_SECONDS) {
      return;
    }

    isSavedRef.current = true;

    try {
      await supabase.from('study_logs').insert({
        user_id: uid,
        activity_type: actType,
        title: actTitle || null,
        duration_seconds: finalSeconds,
      });
    } catch (err) {
      console.warn('Gagal menyimpan sesi belajar ke study_logs:', err);
    }
  }, [pauseTimer]);

  useEffect(() => {
    if (!enabled || !userId) return;

    // Mulai mencatat waktu
    isSavedRef.current = false;
    accumulatedSecondsRef.current = 0;
    lastActiveTimestampRef.current = Date.now();

    // Pause timer saat tab tidak aktif (background / minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseTimer();
      } else {
        resumeTimer();
      }
    };

    // Simpan saat window hendak ditutup / refresh jika durasi mencukupi
    const handleBeforeUnload = () => {
      pauseTimer();
      const finalSeconds = Math.floor(accumulatedSecondsRef.current);
      const { activityType: actType, title: actTitle, userId: uid } = optionsRef.current;
      if (uid && !isSavedRef.current && finalSeconds >= MIN_STUDY_DURATION_SECONDS) {
        isSavedRef.current = true;
        // Gunakan Supabase insert (atau sendBeacon jika didukung)
        supabase.from('study_logs').insert({
          user_id: uid,
          activity_type: actType,
          title: actTitle || null,
          duration_seconds: finalSeconds,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Simpan 1 kali saat unmount jika belum disimpan
      flushSession();
    };
  }, [enabled, userId, pauseTimer, resumeTimer, flushSession]);

  return {
    flushSession,
  };
}
