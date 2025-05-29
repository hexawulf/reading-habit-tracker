import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopAuthors from './TopAuthors';
import { useReadingData } from '../context/ReadingDataContext';

// Mock the useReadingData hook
jest.mock('../context/ReadingDataContext');

// Mock react-icons (if needed, though TopAuthors uses initials for avatar)
// jest.mock('react-icons/fi', () => ({
//   FiUser: () => <svg data-testid="fi-user-icon" />,
// }));

const mockAuthorsData = {
  stats: {
    topAuthors: [
      { author: 'J.R.R. Tolkien', count: 5, averageRating: 4.8 },
      { author: 'George Orwell', count: 2, averageRating: 4.5 },
      { author: 'Jane Austen', count: 3 }, // Author with no averageRating
    ],
  },
  loading: false,
  error: null,
};

const mockEmptyData = {
  stats: { topAuthors: [] },
  loading: false,
  error: null,
};

const mockLoadingData = {
  stats: null,
  loading: true,
  error: null,
};

const mockErrorData = {
  stats: null,
  loading: false,
  error: { message: 'Failed to fetch data' },
};

describe('TopAuthors Page', () => {
  const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(ui, { wrapper: MemoryRouter });
  };

  test('renders loading state correctly', () => {
    useReadingData.mockReturnValue(mockLoadingData);
    renderWithRouter(<TopAuthors />);
    expect(screen.getByText('Loading top authors...')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument(); // Assuming spinner has data-testid
  });

  test('renders error state correctly', () => {
    useReadingData.mockReturnValue(mockErrorData);
    renderWithRouter(<TopAuthors />);
    expect(screen.getByText('Error Loading Author Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
  });

  test('renders "no data" message and upload link when no authors are available', () => {
    useReadingData.mockReturnValue(mockEmptyData);
    renderWithRouter(<TopAuthors />);

    expect(screen.getByText('Top Authors')).toBeInTheDocument();
    expect(screen.getByText('No author data available. Read some books to see your top authors!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upload Data' })).toBeInTheDocument();
  });

  describe('With Author Data', () => {
    beforeEach(() => {
      useReadingData.mockReturnValue(mockAuthorsData);
      renderWithRouter(<TopAuthors />);
    });

    test('renders the main title "Top Authors"', () => {
      expect(screen.getByRole('heading', { name: 'Top Authors', level: 1 })).toBeInTheDocument();
    });

    test('renders the horizontal scroller container', () => {
      expect(document.querySelector('.top-authors-scroller')).toBeInTheDocument();
    });

    test('renders the correct number of author cards', () => {
      const authorCards = screen.getAllByRole('link', { class: 'author-card-item' });
      expect(authorCards).toHaveLength(mockAuthorsData.stats.topAuthors.length);
    });

    mockAuthorsData.stats.topAuthors.forEach(author => {
      test(`renders card for ${author.author} with correct details`, () => {
        const authorCardLink = screen.getByText(author.author).closest('a'); // Find link by author name
        expect(authorCardLink).toBeInTheDocument();

        // Check href
        const expectedSlug = encodeURIComponent(author.author);
        expect(authorCardLink).toHaveAttribute('href', `/author/${expectedSlug}`);
        
        // Check avatar placeholder (initials)
        const initials = author.author.split(' ').map(n => n[0]).join('').toUpperCase();
        // If only one word, use first char. If multiple, first char of first and last.
        let expectedInitials = '?';
        if (author.author) {
            const names = author.author.split(' ');
            if (names.length === 1) expectedInitials = names[0].charAt(0).toUpperCase();
            else expectedInitials = names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
        }
        expect(authorCardLink.querySelector('.author-avatar-placeholder > span')).toHaveTextContent(expectedInitials);

        // Check book count
        expect(authorCardLink.querySelector('.author-info')).toHaveTextContent(
          `${author.count} book${author.count !== 1 ? 's' : ''} read`
        );

        // Check average rating (conditionally)
        if (author.averageRating) {
          expect(authorCardLink.querySelector('.author-rating')).toHaveTextContent(
            `Avg Rating: ${author.averageRating.toFixed(1)} ★`
          );
        } else {
          expect(authorCardLink.querySelector('.author-rating')).toBeNull();
        }
      });
    });
  });
});
