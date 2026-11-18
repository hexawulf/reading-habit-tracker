// All keys this app stores in the browser. Cleared together on logout.
const APP_KEYS = [
  'readingData',
  'stats',
  'userEmail',
  'userName',
  'userPicture',
  'isAuthenticated',
];

const storageService = {
  // Ask the server whether this session is signed in. Falls back to false on
  // any error so a broken request never looks like a logged-in user.
  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/status', { credentials: 'include' });
      if (!response.ok) return { isAuthenticated: false, user: null };
      const data = await response.json();
      return {
        isAuthenticated: !!data.isAuthenticated,
        user: data.user || null,
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, user: null };
    }
  },

  saveData: async (payload) => {
    try {
      const readingData = Array.isArray(payload.readingData) ? payload.readingData : [];
      const { isAuthenticated } = await storageService.checkAuth();

      if (isAuthenticated) {
        const response = await fetch('/api/user/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ readingData, stats: payload.stats }),
        });
        if (!response.ok) {
          console.error('Failed to save data to server:', response.status);
          return false;
        }
        return true;
      }

      // Guest: store locally only.
      localStorage.setItem('readingData', JSON.stringify(readingData));
      localStorage.setItem('stats', JSON.stringify(payload.stats));
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  },

  loadData: async () => {
    try {
      const { isAuthenticated } = await storageService.checkAuth();
      if (isAuthenticated) {
        const response = await fetch('/api/user/data', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          return {
            readingData: Array.isArray(data.readingData) ? data.readingData : [],
            stats: data.stats || {},
            goals: data.goals || null,
          };
        }
        return { readingData: [], stats: {}, goals: null };
      }

      // Guest: read local storage.
      const readingData = localStorage.getItem('readingData');
      const stats = localStorage.getItem('stats');
      return {
        readingData: readingData ? JSON.parse(readingData) : [],
        stats: stats ? JSON.parse(stats) : {},
        goals: null,
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return { readingData: [], stats: {}, goals: null };
    }
  },

  clearData: async () => {
    try {
      localStorage.removeItem('readingData');
      localStorage.removeItem('stats');
      const { isAuthenticated } = await storageService.checkAuth();
      if (isAuthenticated) {
        await fetch('/api/user/data', {
          method: 'DELETE',
          credentials: 'include',
        });
      }
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  // Log out on the server (destroy session + clear cookie), then clear every
  // app key from this browser so a shared machine does not leak data.
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Error during server logout:', error);
    } finally {
      APP_KEYS.forEach((key) => localStorage.removeItem(key));
    }
    return true;
  },
};

export default storageService;
