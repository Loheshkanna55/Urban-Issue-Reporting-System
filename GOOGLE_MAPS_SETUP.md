# Google Maps API Setup Guide

## Steps to Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (optional, for autocomplete)

4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy your API key
6. **IMPORTANT**: Restrict your API key:
   - Application restrictions: HTTP referrers
   - Add your domain (e.g., `localhost:3000/*` for development)
   - API restrictions: Select only the APIs listed above

## Configure Your Application

1. Open `.env` file
2. Replace `GOOGLE_MAPS_API_KEY=AIzaSyBqQ8K_EXAMPLE_REPLACE_WITH_YOUR_KEY`
3. With your actual key: `GOOGLE_MAPS_API_KEY=AIzaSyB...your_real_key`
4. Restart your application

## Security Best Practices

- Never commit your API key to public repositories
- Always use domain restrictions in production
- Monitor your API usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Free Tier

Google Maps provides $200 free monthly credit, which includes:
- 28,000 map loads per month
- 40,000 geocoding requests per month
