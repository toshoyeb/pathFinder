# Security Guide for PathFinder

## 🚨 API Key Security

This project has been configured to use environment variables for sensitive API keys. Follow this guide to maintain security.

## Setup Instructions

### 1. Create your local `.env` file
```bash
cp .env.example .env
```

Then replace the placeholder values in `.env` with your actual API keys.

### 2. Configure Google Services
```bash
cp google-services.json.template google-services.json
```

Then replace the placeholder values with your actual Firebase configuration.

## Environment Variables

### Required Variables
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Your primary Google Maps API key
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ALTERNATE` - Backup API key (optional)

### Firebase Variables (automatically read from google-services.json)
- Firebase Project ID
- Firebase API Key
- OAuth Client IDs

## Security Best Practices

### ✅ DO:
- Use environment variables for all API keys
- Keep `.env` files out of version control
- Use different API keys for development and production
- Restrict API keys with proper scoping in Google Cloud Console
- Regularly rotate API keys
- Monitor API key usage

### ❌ DON'T:
- Hardcode API keys in source code
- Commit `.env` files to git
- Share API keys in chat or email
- Use production keys in development
- Expose internal API keys in client-side code

## Key Rotation

When rotating API keys:
1. Generate new keys in Google Cloud Console
2. Update `.env` file with new keys
3. Update `google-services.json` with new Firebase config
4. Revoke old keys after confirming new ones work

## Expo-Specific Notes

- Variables prefixed with `EXPO_PUBLIC_` are available in client-side code
- These variables will be bundled with your app and visible to users
- Use server-side API keys for sensitive operations
- Consider using Expo's Secure Store for runtime secrets

## Google Cloud Security

### API Key Restrictions
Restrict your Google Maps API key:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Edit your API key
4. Add application restrictions (Android/iOS bundle IDs)
5. Add API restrictions (only enable needed APIs)

### Monitoring
- Enable billing alerts
- Monitor API usage in Google Cloud Console
- Set up usage quotas to prevent overuse

## Deployment

For production builds:
- Use EAS Build secrets for environment variables
- Never include development keys in production builds
- Use different Firebase projects for dev/staging/prod

## Emergency Response

If API keys are compromised:
1. Immediately revoke compromised keys in Google Cloud Console
2. Generate new keys
3. Update all environments
4. Review usage logs for suspicious activity
5. Consider enabling additional security measures

## Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Google Cloud API Security](https://cloud.google.com/docs/security)
- [Firebase Security Rules](https://firebase.google.com/docs/rules) 