import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';

// Header now gets its signed-in state from the server via storageService
// (RH-05), not from localStorage. Mock the service so the test controls it.
// Default-exported modules must be mocked as { default: ... } under Vitest.
vi.mock('../services/storageService', () => ({
  default: {
    checkAuth: vi.fn(),
    logout: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('./Auth', () => ({
  default: () => <div data-testid="auth-modal">Auth Modal Content</div>,
}));

vi.mock('./AboutModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="about-modal">
      About Modal Content
      <button onClick={onClose}>Close About</button>
    </div>
  ),
}));

vi.mock('react-icons/fi', () => ({
  FiInfo: () => <svg data-testid="fi-info-icon" />,
  FiGithub: () => <svg data-testid="fi-github-icon" />,
  FiUser: () => <svg data-testid="fi-user-icon" />,
  FiLogOut: () => <svg data-testid="fi-logout-icon" />,
  FiSettings: () => <svg data-testid="fi-settings-icon" />,
  FiSun: () => <svg data-testid="fi-sun-icon" />,
  FiMoon: () => <svg data-testid="fi-moon-icon" />,
}));

import storageService from '../services/storageService';

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

// Set the mocked auth state the server would return.
const setAuth = (isAuthenticated, user = null) => {
  storageService.checkAuth.mockResolvedValue({ isAuthenticated, user });
};

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders logo, title, and key navigation elements', async () => {
    setAuth(false);
    renderHeader();

    expect(screen.getByAltText('Reading Habit Tracker Logo')).toBeInTheDocument();
    expect(screen.getByText('Reading Tracker')).toBeInTheDocument();
    expect(screen.getByTitle('About Reading Tracker')).toBeInTheDocument();
    expect(screen.getByTitle('GitHub Repository')).toBeInTheDocument();
    // When signed out the account button's title is "Account".
    expect(await screen.findByTitle('Account')).toBeInTheDocument();
  });

  describe('User Authentication and Modals', () => {
    test('shows Auth modal when an unauthenticated user clicks the account icon', async () => {
      setAuth(false);
      renderHeader();

      const userIcon = await screen.findByTitle('Account');
      fireEvent.click(userIcon);

      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    test('shows the user dropdown when an authenticated user clicks the account button', async () => {
      setAuth(true, { name: 'Test User', picture: 'test.jpg' });
      renderHeader();

      const userAvatarButton = await screen.findByTitle('Test User');
      fireEvent.click(userAvatarButton);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('dropdown closes when clicking outside', async () => {
      setAuth(true, { name: 'Test User', picture: 'test.jpg' });
      render(
        <MemoryRouter>
          <div>
            <Header />
            <div data-testid="outside-element">Outside</div>
          </div>
        </MemoryRouter>
      );

      const userAvatarButton = await screen.findByTitle('Test User');
      fireEvent.click(userAvatarButton);
      expect(screen.getByText('Logout')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside-element'));
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    test('handles logout correctly', async () => {
      setAuth(true, { name: 'Test User', picture: 'test.jpg' });

      // Header sets window.location.href on logout; make it writable.
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      renderHeader();

      const userAvatarButton = await screen.findByTitle('Test User');
      fireEvent.click(userAvatarButton);

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(storageService.logout).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(window.location.href).toBe('/');
      });

      window.location = originalLocation;
    });
  });

  test('shows the About modal when the about icon is clicked, and closes it', async () => {
    setAuth(false);
    renderHeader();

    const aboutIcon = screen.getByTitle('About Reading Tracker');
    fireEvent.click(aboutIcon);

    expect(screen.getByTestId('about-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close About'));
    expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument();
  });
});
