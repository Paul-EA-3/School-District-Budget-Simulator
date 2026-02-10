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
1.  **Build and Deploy manually**:
    ```bash
    gcloud builds submit --tag gcr.io/[PROJECT-ID]/budget-simulator
    gcloud run deploy --image gcr.io/[PROJECT-ID]/budget-simulator --platform managed
    ```

### Continuous Deployment with Cloud Build and GitHub

To automatically deploy to Cloud Run whenever you push to GitHub:

1.  **Connect Repository**: Go to the [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers) page and connect your GitHub repository.
2.  **Create Trigger**:
    *   **Event**: Push to a branch (e.g., `main`).
    *   **Configuration**: Select **Cloud Build configuration file (yaml or json)**.
    *   **Location**: Repository (default `cloudbuild.yaml`).
3.  **Substitution Variables**: Under "Advanced", add the following variables to pass your secrets to the Vite build:
    *   `_VITE_GEMINI_API_KEY`: Your Gemini API Key.
    *   `_VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API Key.
    *   `_VITE_GA_TRACKING_ID`: Your Google Analytics ID.
4.  **Permissions**: Ensure the Cloud Build service account has the **Cloud Run Admin** and **Service Account User** roles.

---

## Managing Environment Variables (Security)

**CRITICAL**: Do not commit your `.env` file to version control.

### For Firebase Hosting (CI/CD with GitHub Actions):

GitHub Actions allows you to automate your deployment whenever you push code or open a Pull Request.

#### 1. Configure GitHub Secrets
In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:
- `VITE_GEMINI_API_KEY`: Your Gemini API Key.
- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API Key.
- `VITE_GA_TRACKING_ID`: Your Google Analytics ID (e.g., `G-XXXXXX`).

#### 2. PR Previews and Branch Deploys
When you run `firebase init hosting`, Firebase creates two workflow files in `.github/workflows/`:

- **Pull Request Previews (`firebase-hosting-pull-request.yml`)**:
  - Automatically deploys a temporary "preview" version of your site when you open a PR.
  - This allows you to review changes in a live environment before merging.
- **Production Deploy (`firebase-hosting-merge.yml`)**:
  - Automatically deploys to your live site when you merge a PR into your `main` branch.

#### 3. Updating the Workflow for Environment Variables
Vite requires environment variables to be present *at build time*. You must update these `.yml` files to include your secrets.

**Example Build Step in `.github/workflows/firebase-hosting-merge.yml`:**
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
