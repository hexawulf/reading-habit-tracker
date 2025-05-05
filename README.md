## 📚 Reading Habit Tracker

![Book Icon](generated-icon.png)


# Reading Habit Tracker

A web application for tracking and visualizing your reading habits using Goodreads export data. This tool allows you to upload your Goodreads library export CSV and provides insightful visualizations and statistics about your reading history.


## Features

- **Direct Goodreads CSV Import**: Simply upload your Goodreads library export to get started
- **Comprehensive Dashboard**: View an overview of your reading habits at a glance
- **Reading Progress Tracking**: Track your progress toward yearly and monthly reading goals
- **Detailed Visualizations**: Analyze your reading patterns with interactive charts and graphs
- **Author Statistics**: Discover your most-read authors and genres
- **Reading Pace Analysis**: Monitor your reading speed and patterns over time
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## How to Get Your Goodreads Data

1. Log in to your Goodreads account
2. Navigate to "My Books" (your bookshelf)
3. Click on "Import and Export" (at the bottom of the left sidebar)
4. Select "Export Library"
5. Wait for the export to be generated and download the CSV file
6. Upload the CSV file to the Reading Habit Tracker

## Tech Stack

- **Frontend**: React, React Router, Recharts (for visualizations)
- **Backend**: Node.js, Express
- **Data Processing**: CSV Parser, Day.js
- **Styling**: CSS (with custom components)

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/hexawulf/reading-habit-tracker.git
   cd reading-habit-tracker
   ```

2. Install server dependencies:
   ```
   npm install
   ```

3. Install client dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

4. Create an uploads directory:
   ```
   mkdir uploads
   ```

### Running the Application

1. Start the development server:
   ```
   npm run dev
   ```

2. Start the client:
   ```
   npm run client
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Deployment

The application is designed to be easily deployed to various platforms such as Heroku, Vercel, or Netlify.

### Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Log in to Heroku CLI:
   ```
   heroku login
   ```

3. Create a new Heroku app:
   ```
   heroku create reading-habit-tracker
   ```

4. Deploy to Heroku:
   ```
   git push heroku main
   ```

### Environment Variables

The following environment variables can be used to configure the application:

- `PORT`: Port on which the server will run (default: 5000)
- `NODE_ENV`: Environment mode (development, production)

## Project Structure

```
├── client/                  # React frontend
│   ├── public/              # Static files
│   ├── src/                 # Source files
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   ├── App.js           # Main application component
│   │   └── index.js         # Entry point
├── server.js                # Express server
├── utils/                   # Server utilities
│   └── goodreadsParser.js   # CSV parsing utility
├── uploads/                 # Upload directory for CSV files
├── package.json             # Project dependencies
└── README.md                # Project documentation
```

## API Endpoints

The Reading Habit Tracker provides the following API endpoints:

- `POST /api/upload` - Upload a Goodreads CSV file for processing
- `GET /api/stats` - Get reading statistics based on the most recently uploaded file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Goodreads for providing the export functionality
- The open-source libraries used in this project
- All book lovers who track their reading habits!

## Roadmap

Here are some features planned for future releases:

- [ ] Reading challenges (e.g., read books from different countries)
- [ ] Book recommendations based on reading history
- [ ] Integration with Open Library API for book covers
- [ ] Social sharing features
- [ ] Dark mode
- [ ] User accounts and data persistence
- [ ] Multiple library support (import from multiple sources)
- [ ] Reading statistics comparison with friends

## Contact

hexawulf - [@hexawulf](https://twitter.com/hexawulf) - hexawulf@gmail.com

Project Link: [https://github.com/hexawulf/reading-habit-tracker](https://github.com/hexawulf/reading-habit-tracker)
