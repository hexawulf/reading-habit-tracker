# Reading Habit Tracker - Project Overview

## Project Summary

The Reading Habit Tracker is a web application that helps book lovers track and visualize their reading habits. It's specifically designed to work with Goodreads export data, allowing users to upload their reading history and get meaningful insights into their reading patterns.

**Project URL:** [https://hexawulf.dev/reading-tracker](https://hexawulf.dev/reading-tracker)  
**GitHub Repository:** [https://github.com/hexawulf/reading-habit-tracker](https://github.com/hexawulf/reading-habit-tracker)

## Architecture Overview

The Reading Habit Tracker follows a modern web application architecture:

### Backend (Node.js/Express)

The backend is responsible for:
- Handling file uploads (Goodreads CSV)
- Processing and analyzing reading data
- Providing API endpoints for the frontend

### Frontend (React)

The frontend provides:
- User interface for uploading CSV files
- Interactive dashboard with visualizations
- Reading progress tracking and goal setting
- Detailed analysis views (yearly, monthly, authors, etc.)

## Key Components

### Backend Components

1. **Express Server (`server.js`):** 
   - Handles HTTP requests
   - Manages file uploads
   - Defines API endpoints

2. **Goodreads Parser (`utils/goodreadsParser.js`):**
   - Parses Goodreads CSV data
   - Performs data analysis
   - Generates reading statistics

### Frontend Components

1. **File Upload (`FileUpload.js`):**
   - Provides drag-and-drop interface for CSV upload
   - Validates files before submission
   - Shows upload status and instructions

2. **Reading Data Context (`ReadingDataContext.js`):**
   - Manages application state
   - Provides data to all components
   - Handles API communication

3. **Dashboard (`Dashboard.js`):**
   - Displays overview of reading statistics
   - Shows charts and visualizations
   - Provides navigation to detailed views

4. **Yearly Progress (`YearlyProgress.js`):**
   - Shows year-by-year reading trends
   - Provides comparison between years
   - Displays cumulative reading progress

5. **Other Pages:**
   - Monthly Progress
   - Recent Books
   - Top Authors
   - Reading Goals
   - Detailed Statistics

## Data Flow

1. User uploads Goodreads CSV file
2. Backend processes the file and extracts reading data
3. Backend analyzes the data and generates statistics
4. Frontend receives the processed data and populates the context
5. React components consume the context data and render visualizations
6. User navigates through different views to explore their reading habits

## Technologies Used

### Backend

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Multer**: File upload handling
- **CSV-Parser**: CSV parsing library
- **Day.js**: Date manipulation

### Frontend

- **React**: UI library
- **React Router**: Client-side routing
- **Recharts**: Charting library
- **Axios**: HTTP client
- **CSS**: Custom styling

## Features in Detail

### 1. Goodreads CSV Import

The application accepts CSV exports from Goodreads, which contain reading history including:
- Book titles and authors
- Reading dates
- User ratings
- Page counts
- Shelves/categories

### 2. Reading Dashboard

The dashboard provides a comprehensive overview of reading habits:
- Total books read
- Current year progress
- Average rating
- Reading pace statistics
- Goal progress tracking

### 3. Yearly Reading Progress

The yearly progress view shows:
- Books read by year
- Year-over-year comparison
- Cumulative reading total
- Reading pace trends

### 4. Monthly Reading Analysis

The monthly analysis breaks down reading by month:
- Month-by-month comparison
- Seasonal reading patterns
- Current vs. previous year comparison

### 5. Author Statistics

The author statistics view shows:
- Most-read authors
- Distribution of books by author
- Rating patterns by author

### 6. Reading Goals

The goals feature allows users to:
- Set yearly, monthly, and page count goals
- Track progress toward goals
- Adjust goals based on reading history

### 7. Book Lists

The application provides various book lists:
- Recently read books
- Highest rated books
- Longest/shortest books
- Books by genre/category

## Development Roadmap

### Phase 1: MVP (Current Implementation)

- Basic file upload functionality
- Core reading statistics
- Essential visualizations
- Responsive UI

### Phase 2: Enhanced Features

- User accounts and data persistence
- Reading challenges
- Book covers via Open Library API
- Dark mode

### Phase 3: Advanced Features

- Social sharing
- Multiple library support
- Reading recommendations
- Expanded analytics

## Getting Involved

The Reading Habit Tracker is an open-source project. Contributions are welcome in the form of:
- Bug reports
- Feature requests
- Code contributions
- Documentation improvements

See the README.md and CONTRIBUTING.md files for more information on how to get involved.

## Conclusion

The Reading Habit Tracker aims to provide book lovers with meaningful insights into their reading habits. By leveraging Goodreads export data, it offers a powerful way to visualize reading progress, set goals, and discover patterns in reading behavior.

Whether you're a casual reader or a dedicated bookworm, the Reading Habit Tracker can help you better understand your reading journey and motivate you to achieve your reading goals.