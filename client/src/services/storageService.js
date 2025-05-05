// client/src/services/storageService.js
const STORAGE_KEY = 'reading-habit-tracker-data';

const storageService = {
  // Save reading data to localStorage
  saveData: (data) => {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serializedData);
      return true;
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      return false;
    }
  },

  // Load reading data from localStorage
  loadData: () => {
    try {
      const serializedData = localStorage.getItem(STORAGE_KEY);
      if (serializedData === null) {
        return null;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return null;
    }
  },

  // Clear reading data from localStorage
  clearData: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing data from localStorage:', error);
      return false;
    }
  }
};

export default storageService;