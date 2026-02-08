import { create } from "zustand";

interface AnalyticsData {
  totalClicks: number;
  totalLinks: number;
  deviceStats: Record<string, number>;
  browserStats: Record<string, number>;
  osStats: Record<string, number>;
  topLinks: Array<{ key: string; url: string; clicks: number }>;
  clicksOverTime: Array<{ date: string; clicks: number }>;
}

interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  setData: (data: AnalyticsData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialData: AnalyticsData = {
  totalClicks: 0,
  totalLinks: 0,
  deviceStats: {},
  browserStats: {},
  osStats: {},
  topLinks: [],
  clicksOverTime: [],
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  setData: (data) => set({ data, error: null }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set({ data: initialData, error: null }),
}));
