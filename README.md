# School District Budget Simulator

A strategic resource allocation simulation designed for school district superintendents and education leaders. This application allows users to experience the complexities of balancing a school district's budget while managing academic outcomes and community trust.

## Features

- **Forensic Briefing**: Automatically gathers real-world data for US school districts using AI-driven API discovery and web scraping.
- **Dynamic Simulation**: Generates realistic school rosters and financial scenarios tailored to the selected district's archetype (Urban, Suburban, Rural).
- **Resource Allocation**: Evaluate and implement various budget proposals, from hiring specialists to consolidating schools.
- **AI Advisor**: Interact with a Gemini-powered advisor to get insights and guidance on your budget decisions.
- **Board Review**: Present your final budget to an AI-simulated School Board for feedback and approval.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **AI**: Firebase AI Logic SDK (Gemini 2.0 Flash & Thinking)
- **Icons**: Lucide React
- **Data Integration**: US Spending API, Socrata Open Data, and live state-level data scraping.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Building for Production

To create a production build:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

## Environment Variables

The application uses the following environment variables (set via your deployment platform or a `.env` file for local development):

- `VITE_GOOGLE_MAPS_API_KEY`: Required for the district selection map and search.
- `VITE_GA_TRACKING_ID`: (Optional) Google Analytics tracking ID.

*Note: AI functionality is powered by Firebase AI Logic and does not require a client-side API key if properly configured in Firebase.*

## License

Internal Only - Education Associates.
