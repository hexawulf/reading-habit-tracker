## 📚 Reading Habit Tracker

<p align="center">
  <img src="generated-icon.png" alt="Book Icon" width="180"/>
</p>

# Reading Habit Tracker

A web application for tracking and visualizing your reading habits using Goodreads export data. This tool allows you to upload your Goodreads library export CSV and provides insightful visualizations and statistics about your reading history.

---

## ✨ Features

- **Direct Goodreads CSV Import**: Simply upload your Goodreads library export to get started  
- **Comprehensive Dashboard**: View an overview of your reading habits at a glance  
- **Reading Progress Tracking**: Track your progress toward yearly and monthly reading goals  
- **Detailed Visualizations**: Analyze your reading patterns with interactive charts and graphs  
- **Author Statistics**: Discover your most-read authors and genres  
- **Reading Pace Analysis**: Monitor your reading speed and patterns over time  
- **Responsive Design**: Works seamlessly on desktop and mobile devices  

---

## 📤 How to Get Your Goodreads Data

1. Log in to your Goodreads account  
2. Navigate to **My Books**  
3. Click on **Import and Export** (bottom left sidebar)  
4. Select **Export Library**  
5. Download the generated CSV file  
6. Upload it to the Reading Habit Tracker

---

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Recharts  
- **Backend**: Node.js, Express  
- **Data Processing**: CSV Parser, Day.js  
- **Styling**: Custom CSS  

---

## 🧑‍💻 Local Development

### ✅ Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- ImageMagick (provides the `convert` command used by `generate_favicons.sh`)

To generate application favicons place your source image in `client/public` and run `./generate_favicons.sh`.

### 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/hexawulf/reading-habit-tracker.git
cd reading-habit-tracker

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Create an uploads directory
mkdir uploads
🏃 Running the Application
bash
Copy
Edit
# Start the backend
npm run dev

# Start the frontend
npm run client
Then open your browser and navigate to: http://localhost:3000
```
🌐 Deployment
This app can be deployed to Heroku, Vercel, or Netlify.

🚀 Heroku Deployment
bash
Copy
Edit
heroku login
heroku create reading-habit-tracker
git push heroku main
🌱 Environment Variables
Variable	Description
PORT	Port on which the server runs (default: 5000)
NODE_ENV	Environment mode (development/production)

📁 Project Structure
pgsql
Copy
Edit
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── utils/
│       ├── App.js
│       └── index.js
├── server.js
├── utils/
│   └── goodreadsParser.js
├── uploads/
├── package.json
└── README.md
📡 API Endpoints
POST /api/upload – Upload a Goodreads CSV

GET /api/stats – Get generated reading stats

🤝 Contributing
Fork the repo

Create a branch (git checkout -b feature/my-feature)

Commit your changes (git commit -m 'Add feature')

Push to GitHub (git push origin feature/my-feature)

Open a Pull Request

📜 License
MIT License – see the LICENSE file for details.

🙏 Acknowledgments
Goodreads for export tools

Open-source devs who make great libraries

You — the reader, the tracker, the book lover!

🔮 Roadmap
 Reading challenges

 Open Library API integration

 Book recommendations

 User accounts & data sync

 Dark mode

 Social sharing

 Friend stats comparison

📬 Contact
hexawulf
Twitter: @hexawulf
📧 hexawulf@gmail.com

GitHub Project: https://github.com/hexawulf/reading-habit-tracker
