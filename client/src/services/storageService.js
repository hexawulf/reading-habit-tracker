
// client/src/services/storageService.js
const STORAGE_KEY = 'reading-habit-tracker-data';

const storageService = {
  isLoggedIn: () => {
    return !!localStorage.getItem('user');
  },

  saveData: async (data) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serializedData);
      
      if (storageService.isLoggedIn()) {
        // Also save to server if logged in
        await fetch('/api/user/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: serializedData
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
        // Try to load from server first
        const response = await fetch('/api/user/data', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
      
      // Fall back to local storage
      const serializedData = localStorage.getItem(STORAGE_KEY);
      return serializedData ? JSON.parse(serializedData) : null;
    } catch (error) {
      console.error('Error loading data:', error);
      return null;
    }
  },

  clearData: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
