import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useReadingData } from '../context/ReadingDataContext';

// Mock the useReadingData hook
jest.mock('../context/ReadingDataContext');

// Mock Recharts components to avoid complex rendering and console errors
jest.mock('recharts', () => {
  const MockResponsiveContainer = ({ children }) => <div data-testid="responsive-container">{children}</div>;
  const MockBarChart = ({ children }) => <div data-testid="bar-chart">{children}</div>;
  const MockPieChart = ({ children }) => <div data-testid="pie-chart">{children}</div>;
  const MockBar = () => <div data-testid="bar-element" />;
  const MockPie = ({children}) => <div data-testid="pie-element">{children}</div>; // Pie can have Cell children
  const MockCell = () => <div data-testid="cell-element" />;
  const MockXAxis = () => <div data-testid="xaxis-element" />;
  const MockYAxis = () => <div data-testid="yaxis-element" />;
  const MockCartesianGrid = () => <div data-testid="cartesian-grid-element" />;
  const MockTooltip = () => <div data-testid="tooltip-element" />;
  const MockLegend = () => <div data-testid="legend-element" />;
  
  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    PieChart: MockPieChart,
    Bar: MockBar,
    Pie: MockPie,
    Cell: MockCell,
    XAxis: MockXAxis,
    YAxis: MockYAxis,
    CartesianGrid: MockCartesianGrid,
    Tooltip: MockTooltip,
    Legend: MockLegend,
  };
});

const mockDashboardData = {
  stats: {
    totalBooks: 120,
    readingByYear: { '2023': 50, '2024': 30 },
    averageRating: 4.2,
    readingPace: { booksPerMonth: 4.5, booksPerYear: 54, pagesPerDay: 150 },
    pageStats: { averageLength: 320, longestBook: { title: 'Epic Novel', pages: 1000 } },
    ratingDistribution: { '5': 60, '4': 40, '3': 15, '2': 5, '1': 0 },
    topAuthors: [{ author: 'Author One', count: 10 }, { author: 'Author Two', count: 8 }],
    readingByMonth: {
      '2024': [2,3,4,5,2,3,4,0,0,0,0,0], // Books per month for current year
      '2023': [1,2,3,4,5,6,7,8,4,3,2,1], // Books per month for previous year
    },
    readingByGenre: { 'Fantasy': 50, 'Sci-Fi': 30 },
    totalPages: 38400,
  },
  readingData: [ // Sample recent books
    { title: 'Recent Book 1', author: 'Author A', myRating: 5, dateRead: '2024-03-15', pages: 300 },
    { title: 'Recent Book 2', author: 'Author B', myRating: 4, dateRead: '2024-03-01', pages: 250 },
  ],
  goalProgress: {
    yearly: { current: 30, target: 60, percentage: 50 },
    monthly: { current: 4, target: 5, percentage: 80 },
  },
  loading: false,
  error: null,
};

const mockEmptyData = {
  stats: null, // Or specific empty structures if component expects them
  readingData: [],
  goalProgress: null,
  loading: false,
  error: null,
};

const mockLoadingData = {
  stats: null,
  readingData: [],
  goalProgress: null,
  loading: true,
  error: null,
};

const mockErrorData = {
  stats: null,
  readingData: [],
  goalProgress: null,
  loading: false,
  error: { message: 'Failed to load dashboard' },
};


describe('Dashboard Page', () => {
  const renderWithRouter = (ui) => {
    return render(ui, { wrapper: MemoryRouter });
  };

  test('renders loading state correctly', () => {
    useReadingData.mockReturnValue(mockLoadingData);
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    useReadingData.mockReturnValue(mockErrorData);
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
  });

  test('renders "no data" message and upload link when no stats or readingData', () => {
    useReadingData.mockReturnValue(mockEmptyData);
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('No Reading Data Available')).toBeInTheDocument();
    expect(screen.getByText('Please upload your Goodreads export file to get started.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upload File' })).toBeInTheDocument();
  });
  
  describe('With Data Rendered', () => {
    beforeEach(() => {
      useReadingData.mockReturnValue(mockDashboardData);
      renderWithRouter(<Dashboard />);
    });

    test('renders main dashboard title', () => {
      expect(screen.getByRole('heading', { name: 'Reading Dashboard', level: 1 })).toBeInTheDocument();
    });

    test('renders Key Statistics section and its cards', () => {
      expect(screen.getByRole('heading', { name: 'Key Statistics', level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Total Books')).toBeInTheDocument();
      expect(screen.getByText(mockDashboardData.stats.totalBooks.toString())).toBeInTheDocument();
      expect(screen.getByText(`Read in ${new Date().getFullYear()}`)).toBeInTheDocument();
      // Add more specific checks for other stat cards if needed
    });

    test('renders Reading Goals Progress section', () => {
      expect(screen.getByRole('heading', { name: 'Reading Goals Progress', level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Yearly Goal')).toBeInTheDocument();
      expect(screen.getByText('Monthly Goal')).toBeInTheDocument();
      expect(screen.getByText(/Manage Goals/i)).toBeInTheDocument();
    });

    test('renders Books Read By Year chart section', () => {
      expect(screen.getByRole('heading', { name: 'Books Read By Year', level: 3 })).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Mocked chart
    });

    test('renders Monthly Comparison chart section', () => {
        const currentYear = new Date().getFullYear().toString();
        const previousYear = (parseInt(currentYear) - 1).toString();
        expect(screen.getByRole('heading', { name: `Monthly Comparison (${currentYear} vs ${previousYear})`, level: 3 })).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart').length).toBeGreaterThanOrEqual(1); // Can be multiple bar charts
    });
    
    test('renders Rating Distribution chart section', () => {
      expect(screen.getByRole('heading', { name: 'Rating Distribution', level: 3 })).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument(); // Mocked chart
    });

    test('renders Top Authors section', () => {
      expect(screen.getByRole('heading', { name: 'Top Authors', level: 3 })).toBeInTheDocument();
      expect(screen.getByText(mockDashboardData.stats.topAuthors[0].author)).toBeInTheDocument();
    });

    test('renders Recently Read Books section', () => {
      expect(screen.getByRole('heading', { name: 'Recently Read Books', level: 2 })).toBeInTheDocument();
      expect(screen.getByText(mockDashboardData.readingData[0].title)).toBeInTheDocument();
    });

    test('renders Reading Insights section', () => {
      expect(screen.getByRole('heading', { name: 'Reading Insights', level: 2 })).toBeInTheDocument();
      expect(screen.getByText('Total Pages')).toBeInTheDocument();
      // Add checks for other insights if needed
    });
  });
});
