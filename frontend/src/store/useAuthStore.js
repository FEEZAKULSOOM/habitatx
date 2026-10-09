import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Verifies cookie session on initial application load
  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),



  logout: async () => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    console.error(err);
  } finally {
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login'; // Ensures clean slate across storage and query cache
  }
}
}));