// localStorage wrapper replacing window.storage API
const PREFIX = 'miniverse:';

export const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value !== null ? { value } : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, value);
    } catch (e) {
      console.warn('Storage set failed:', e);
    }
  },

  async delete(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  }
};
