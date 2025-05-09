
const STORAGE_KEY = 'reading-habit-tracker-data';

const storageService = {
  isLoggedIn: () => {
    return !!localStorage.getItem('user');
  },

  saveData: async (payload) => {
    try {
      // Ensure readingData is always an array
      const readingData = Array.isArray(payload.readingData) ? payload.readingData : [];
      localStorage.setItem('readingData', JSON.stringify(readingData));
      localStorage.setItem('stats', JSON.stringify(payload.stats));
      
      if (storageService.isLoggedIn()) {
        await fetch('/api/user/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ readingData, stats: payload.stats })
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  },

  loadData: async () => {
    try {
      if (storageService.isLoggedIn()) {
        const response = await fetch('/api/user/data', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          return {
            readingData: Array.isArray(data.readingData) ? data.readingData : [],
            stats: data.stats || {}
          };
        }
      }
      
      const readingData = localStorage.getItem('readingData');
      const stats = localStorage.getItem('stats');
      
      return {
        readingData: readingData ? JSON.parse(readingData) : [],
        stats: stats ? JSON.parse(stats) : {}
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return { readingData: [], stats: {} };
    }
  },

  clearData: () => {
    try {
      localStorage.removeItem('readingData');
      localStorage.removeItem('stats');
      if (storageService.isLoggedIn()) {
        fetch('/api/user/data', {
          method: 'DELETE',
          credentials: 'include'
        });
      }
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }
};

export default storageService;
