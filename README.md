# FIT Compare Tool

A comprehensive cycling workout analysis tool that allows athletes and coaches to upload, analyze, and compare multiple .FIT files from various cycling workouts. Compare performance metrics, track improvements, and share workout analyses with team members.

## Features

- **Multiple File Analysis**: Upload and compare multiple .FIT files simultaneously
- **Advanced Metrics Comparison**: Compare power, heart rate, cadence, speed, and altitude data
- **Interactive Visualizations**: Dynamic charts powered by Recharts for detailed data analysis
- **Secure Authentication**: Firebase-powered authentication with Google sign-in support
- **Dataset Management**: Create, edit, and organize workout datasets
- **Sharing Capabilities**: Generate shareable links for workout comparisons
- **Export Options**: Export analysis results as PNG or PDF
- **Responsive Design**: Full mobile and desktop support

## Tech Stack

- **Frontend**: React/Vite with TypeScript
- **UI Components**: Shadcn UI + Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: PostgreSQL with Drizzle ORM
- **File Parsing**: FIT File Parser
- **Data Visualization**: Recharts
- **Routing**: Wouter
- **State Management**: TanStack Query + Zustand
- **Export**: html2canvas + jsPDF

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database
3. Firebase project configured with Google Authentication

### Firebase Setup

1. Create a new project in the [Firebase Console](https://console.firebase.google.com)
2. Enable Google Authentication in the Authentication section
3. Add your app's domain to the authorized domains list
4. Note down the following configuration values:
   - Project ID
   - API Key
   - App ID

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Authentication**: Sign in using Google or email/password
2. **Creating Datasets**: Click "New Dataset" and upload your .FIT files
3. **Analyzing Data**: Select files to compare and view the interactive charts
4. **Sharing**: Use the share button to generate a shareable link
5. **Exporting**: Export your analysis as PNG or PDF for offline use

## API Documentation

For detailed API documentation, see [API.md](API.md).

## Data Processing

The tool processes .FIT files and extracts the following metrics:
- Power (watts)
- Cadence (rpm)
- Heart Rate (bpm)
- Speed (km/h)
- Altitude (m)

All metrics are synchronized and indexed for accurate comparison across multiple files.

## Security

- Firebase Authentication ensures secure user access
- User-specific dataset isolation
- Secure sharing mechanism with unique tokens
- PostgreSQL with proper user data isolation
- File upload validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)
test

## Support

For support, please open an issue in the repository.
