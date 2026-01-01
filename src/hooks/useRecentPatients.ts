import { useState, useEffect, useCallback } from 'react';

interface RecentPatient {
  id: string;
  patient_id: string;
  full_name: string;
  phone?: string;
  viewedAt: number;
}

const STORAGE_KEY = 'recent-patients';
const MAX_RECENT = 5;

export function useRecentPatients() {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentPatients(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent patients:', error);
    }
  }, []);

  // Add a patient to recent list
  const addRecentPatient = useCallback((patient: {
    id: string;
    patient_id: string;
    full_name: string;
    phone?: string;
  }) => {
    setRecentPatients(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== patient.id);
      
      // Add to front with timestamp
      const updated = [
        { ...patient, viewedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_RECENT);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent patients:', error);
      }
      
      return updated;
    });
  }, []);

  // Clear all recent patients
  const clearRecentPatients = useCallback(() => {
    setRecentPatients([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent patients:', error);
    }
  }, []);

  return {
    recentPatients,
    addRecentPatient,
    clearRecentPatients,
  };
}
