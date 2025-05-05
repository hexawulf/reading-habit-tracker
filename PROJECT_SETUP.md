# Project Setup Guide for Reading Habit Tracker

This document provides detailed instructions for setting up the Reading Habit Tracker project on your local machine and deploying it to production.

## Local Development Setup

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/hexawulf/reading-habit-tracker.git
cd reading-habit-tracker
```

### 2. Set Up the Backend

1. Install the backend dependencies:

```bash
npm install
```

2. Create the uploads directory:

```bash
mkdir uploads
```

3. Create a `.env` file in the root directory with the following content:

```
PORT=5000
NODE_ENV=development
```

### 3. Set Up the Frontend

1. Navigate to the client directory:

```bash
cd client
```

2. Install the frontend dependencies:

```bash
npm install
```

3. Navigate back to the root directory:

```bash
cd ..
```

### 4. Run the Application in Development Mode

1. Start the backend server:

```bash
npm run dev
```

2. In a separate terminal, start the frontend development server:

```bash
npm run client
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure Explained

### Backend (Node.js/Express)

- `server.js`: Main entry point for the Express server
- `utils/goodreadsParser.js`: Utility functions for parsing and analyzing Goodreads CSV data
- `uploads/`: Directory for storing uploaded CSV files (temporarily)

### Frontend (React)

- `client/src/components/`: Reusable UI components
  - `Header.js`: Application header with navigation
  - `Sidebar.js`: Navigation sidebar
  - `FileUpload.js`: Component for uploading Goodreads CSV files
  - `Footer.js`: Application footer
- `client/src/context/`: React context for state management
  - `ReadingDataContext.js`: Context provider for reading data
- `client/src/pages/`: Page components
  - `Dashboard.js`: Main dashboard page
  - `YearlyProgress.js`: Year-by-year reading progress
  - `MonthlyProgress.js`: Month-by-month reading progress
  - `RecentBooks.js`: Recently read books
  - `Goals.js`: Reading goals setting and tracking
  - `TopAuthors.js`: Most-read authors
  - `ReadingStats.js`: Detailed reading statistics
- `client/src/utils/`: Frontend utility functions
- `client/src/App.js`: Main application component
- `client/src/index.js`: Entry point for React application

## Dependencies

### Backend Dependencies

- `express`: Web framework for Node.js
- `cors`: Middleware for enabling CORS
- `multer`: Middleware for handling file uploads
- `csv-parser`: Library for parsing CSV files
- `dayjs`: Library for date manipulation

### Frontend Dependencies

- `react`: JavaScript library for building user interfaces
- `react-dom`: React package for working with the DOM
- `react-router-dom`: Routing library for React
- `axios`: Promise-based HTTP client
- `recharts`: Charting library for React
- `dayjs`: Library for date manipulation

## Deployment to Production

### 1. GitHub Setup

1. Create a new GitHub repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/hexawulf/reading-habit-tracker.git
git push -u origin main
```

### 2. Setting Up GitHub Pages

1. Install the gh-pages package:

```bash
cd client
npm install --save-dev gh-pages
cd ..
```

2. Add the following to your client's `package.json`:

```json
{
  "homepage": "https://hexawulf.dev/reading-tracker",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

3. Deploy to GitHub Pages:

```bash
cd client
npm run deploy
cd ..
```

### 3. Setting Up the Backend on a Server

#### Option A: Deploy to Heroku

1. Install the Heroku CLI and log in:

```bash
npm install -g heroku
heroku login
```

2. Create a new Heroku app:

```bash
heroku create reading-habit-tracker
```

3. Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "cd client && npm install && npm run build"
  },
  "engines": {
    "node": "14.x"
  }
}
```

4. Deploy to Heroku:

```bash
git push heroku main
```

#### Option B: Deploy to a VPS (e.g., DigitalOcean, AWS)

1. Set up a VPS with Node.js installed
2. Clone your repository to the server
3. Install dependencies:

```bash
npm install
cd client
npm install
npm run build
cd ..
```

4. Set up a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name reading-habit-tracker
```

5. Set up Nginx as a reverse proxy to your Node.js application

### 4. Using Your Domain (hexawulf.dev)

1. Register your domain with a domain registrar (if not already done)
2. Set up DNS records to point to your hosting provider
3. Configure your web server (Nginx, Apache) to serve the application from your domain

## Continuous Integration and Deployment

For automated deployment, you can set up GitHub Actions:

1. Create a `.github/workflows/deploy.yml` file in your repository:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'
        
    - name: Install backend dependencies
      run: npm install
      
    - name: Install frontend dependencies
      run: |
        cd client
        npm install
        npm run build
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./client/build
```

2. Push the changes to GitHub to trigger the deployment workflow.

## Troubleshooting

### Common Issues

1. **File Upload Errors**: Make sure the uploads directory exists and has the proper permissions.
   
2. **CSV Parsing Errors**: Check that your Goodreads export follows the expected format.
   
3. **CORS Errors**: Ensure the CORS middleware is properly configured in server.js.

4. **React Build Issues**: Clear your node_modules and package-lock.json and reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **API Connection Issues**: Check that the backend URL is correctly configured in the frontend.

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Recharts Documentation](https://recharts.org/en-US/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)