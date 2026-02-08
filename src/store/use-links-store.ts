import { create } from "zustand";

interface Link {
  id: string;
  key: string;
  url: string;
  clicks: number;
  createdAt: string;
  password?: string | null;
}

interface LinksState {
  links: Link[];
  isLoading: boolean;
  error: string | null;
  setLinks: (links: Link[]) => void;
  addLink: (link: Link) => void;
  removeLink: (id: string) => void;
  updateLink: (id: string, updates: Partial<Link>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLinksStore = create<LinksState>((set) => ({
  links: [],
  isLoading: false,
  error: null,

  setLinks: (links) => set({ links, error: null }),

  addLink: (link) =>
    set((state) => ({
      links: [link, ...state.links],
      error: null,
    })),

  removeLink: (id) =>
    set((state) => ({
      links: state.links.filter((link) => link.id !== id),
      error: null,
    })),

  updateLink: (id, updates) =>
    set((state) => ({
      links: state.links.map((link) =>
        link.id === id ? { ...link, ...updates } : link
      ),
      error: null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
