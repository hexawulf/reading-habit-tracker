import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import Auth from './Auth'; // Needed for testing Auth modal presence
import AboutModal from './AboutModal'; // Needed for testing About modal presence

// Mock child components to simplify Header testing
jest.mock('./Auth', () => () => <div data-testid="auth-modal">Auth Modal Content</div>);
jest.mock('./AboutModal', () => ({ onClose }) => (
  <div data-testid="about-modal">
    About Modal Content
    <button onClick={onClose}>Close About</button>
  </div>
));

// Mock react-icons
jest.mock('react-icons/fi', () => ({
  FiInfo: () => <svg data-testid="fi-info-icon" />,
  FiGithub: () => <svg data-testid="fi-github-icon" />,
  FiUser: () => <svg data-testid="fi-user-icon" />,
  FiLogOut: () => <svg data-testid="fi-logout-icon" />,
  FiSettings: () => <svg data-testid="fi-settings-icon" />,
  FiDatabase: () => <svg data-testid="fi-database-icon" />,
}));

// Helper to set localStorage mocks
const mockLocalStorage = (isAuthenticated, userName, userPicture) => {
  Storage.prototype.getItem = jest.fn((key) => {
    if (key === 'isAuthenticated') return isAuthenticated ? 'true' : null;
    if (key === 'userName') return userName || null;
    if (key === 'userPicture') return userPicture || null;
    return null;
  });
  Storage.prototype.removeItem = jest.fn();
};

describe('Header Component', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock usage counts
  });

  test('renders logo, title, and key navigation elements', () => {
    mockLocalStorage(false); // Not authenticated
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByAltText('Reading Habit Tracker')).toBeInTheDocument();
    expect(screen.getByText('Reading Tracker')).toBeInTheDocument();
    expect(screen.getByTitle('About Reading Tracker')).toBeInTheDocument();
    expect(screen.getByTitle('GitHub Repository')).toBeInTheDocument();
    expect(screen.getByTitle('Account')).toBeInTheDocument(); // User icon
  });

  describe('User Authentication and Modals', () => {
    test('shows Auth modal when unauthenticated user clicks user icon', () => {
      mockLocalStorage(false);
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      const userIcon = screen.getByTitle('Account');
      fireEvent.click(userIcon);

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    test('shows user dropdown when authenticated user clicks user icon', () => {
      mockLocalStorage(true, 'Test User', 'test.jpg');
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      const userAvatarButton = screen.getByTitle('Test User'); // Title now includes username
      fireEvent.click(userAvatarButton);
      
      expect(screen.getByText('My Data')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('dropdown closes when clicking outside', () => {
        mockLocalStorage(true, 'Test User', 'test.jpg');
        render(
          <MemoryRouter>
            <div> {/* Added a wrapper for the "outside" click target */}
              <Header />
              <div data-testid="outside-element">Outside</div>
            </div>
          </MemoryRouter>
        );
  
        const userAvatarButton = screen.getByTitle('Test User');
        fireEvent.click(userAvatarButton); // Open dropdown
        expect(screen.getByText('My Data')).toBeInTheDocument(); // Dropdown is open
  
        fireEvent.mouseDown(screen.getByTestId('outside-element')); // Click outside
        expect(screen.queryByText('My Data')).not.toBeInTheDocument(); // Dropdown should be closed
      });

    test('handles logout correctly', () => {
      mockLocalStorage(true, 'Test User', 'test.jpg');
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      const userAvatarButton = screen.getByTitle('Test User');
      fireEvent.click(userAvatarButton); // Open dropdown
      
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('isAuthenticated');
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('userName');
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('userPicture');
      expect(window.location.href).toBe('/'); // Check redirect
      expect(screen.queryByText('My Data')).not.toBeInTheDocument(); // Dropdown closed

      window.location = originalLocation; // Restore original location
    });
  });

  test('shows About modal when about icon is clicked', () => {
    mockLocalStorage(false);
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const aboutIcon = screen.getByTitle('About Reading Tracker');
    fireEvent.click(aboutIcon);

    expect(screen.getByTestId('about-modal')).toBeInTheDocument();
    
    // Test closing the About modal
    fireEvent.click(screen.getByText('Close About'));
    expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument();
  });
});
