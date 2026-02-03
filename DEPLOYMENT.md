# Deployment Guide: School District Budget Simulator

This project is a React application built with Vite and integrated with Google Gemini AI. Below are the recommendations for deploying this application to Google Cloud.

## Recommended: Firebase Hosting

Firebase Hosting is the simplest and most cost-effective way to host a Vite application.

### Steps to Deploy:
1.  **Install Firebase CLI**: `npm install -g firebase-tools`
2.  **Initialize Firebase**: `firebase init`
    *   Select **Hosting**.
    *   Select **Use an existing project** or create a new one.
    *   Set the public directory to `dist` (the default Vite build output).
    *   Configure as a single-page app: **Yes**.
    *   Set up automatic builds and deploys with GitHub: **Highly Recommended**.
3.  **Build the Project**: `npm run build`
4.  **Deploy**: `firebase deploy`

---

## Alternative: Google Cloud Run

If you plan to add a Node.js backend or want more control over the runtime environment, Cloud Run is an excellent choice.

### Steps to Deploy:
1.  **Containerize**: Create a `Dockerfile` for the application.
2.  **Build Image**: `gcloud builds submit --tag gcr.io/[PROJECT-ID]/budget-simulator`
3.  **Deploy**: `gcloud run deploy --image gcr.io/[PROJECT-ID]/budget-simulator --platform managed`

---

## Managing Environment Variables (Security)

**CRITICAL**: Do not commit your `.env` file to version control.

### For Firebase Hosting (CI/CD with GitHub Actions):
1.  In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2.  Add the following secrets:
    *   `VITE_GEMINI_API_KEY`: Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/).
    *   `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API Key from [GCP Console](https://console.cloud.google.com/).
    *   `VITE_GA_TRACKING_ID`: Your Google Analytics ID.
3.  Update your GitHub Actions workflow (`.github/workflows/firebase-hosting-merge.yml`) to include these environment variables during the build step:
    ```yaml
    - run: npm ci && npm run build
      env:
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
        VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
        VITE_GA_TRACKING_ID: ${{ secrets.VITE_GA_TRACKING_ID }}
    ```

### For Cloud Run:
You can set environment variables directly in the Cloud Run service configuration or use **Secret Manager** for higher security.

---

## Connection to Google Cloud Services

1.  **Gemini API**: Currently using the Google AI Studio API. For production, consider migrating to **Vertex AI** on Google Cloud for better quotas, SLAs, and enterprise security. The `@google/genai` SDK is compatible with both.
2.  **Google Maps API**: Ensure you enable the **Places API** and **Maps JavaScript API** in your Google Cloud Project. Restrict your API keys to your deployment domain to prevent unauthorized use.
3.  **Analytics**: The project is already configured for Google Analytics (configured in `index.html` via `VITE_GA_TRACKING_ID`).
