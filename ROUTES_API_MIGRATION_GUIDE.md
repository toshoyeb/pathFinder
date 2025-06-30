# Google Routes API v2 Migration Guide

## 🚀 Overview

This guide explains how to migrate from the legacy Google Directions API to the modern Routes API v2. Our pathFinder app has been successfully migrated to take advantage of enhanced features, better performance, and improved route quality.

## 📋 Prerequisites

### 1. Enable Routes API in Google Cloud Console
- Navigate to [Google Cloud Console](https://console.cloud.google.com/)
- Go to APIs & Services → Library
- Search for "Routes API" and enable it
- **Note**: Routes API has different billing than Directions API

### 2. API Key Requirements
- Your existing API key will work
- Ensure Routes API is enabled for your project
- No changes needed to `GOOGLE_MAPS_API_KEY` configuration

## 🔄 Migration Steps

### Step 1: Update API Endpoint
```typescript
// Before (Directions API)
const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
const response = await axios.get(url);

// After (Routes API v2)
const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
const response = await axios.post(url, requestBody, { headers });
```

### Step 2: Change Request Method
- **Before**: GET requests with URL parameters
- **After**: POST requests with JSON body

### Step 3: Update Headers
```typescript
// New Headers Required
const headers = {
  'Content-Type': 'application/json',
  'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
  'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline...'
};
```

### Step 4: Transform Request Structure
```typescript
// Before (URL Parameters)
const params = [
  `origin=${lat},${lng}`,
  `destination=${lat},${lng}`,
  `mode=driving`,
  `alternatives=true`
];

// After (JSON Body)
const requestBody = {
  origin: {
    location: {
      latLng: { latitude: lat, longitude: lng }
    }
  },
  destination: {
    location: {
      latLng: { latitude: lat, longitude: lng }
    }
  },
  travelMode: "DRIVE",
  computeAlternativeRoutes: true
};
```

### Step 5: Update Travel Modes
```typescript
const TRAVEL_MODE_MAP = {
  driving: "DRIVE",      // Changed
  walking: "WALK",       // Changed  
  bicycling: "BICYCLE",  // Changed
  transit: "TRANSIT"     // Same
};
```

### Step 6: Handle Response Changes
```typescript
// Before (Directions API)
const polyline = route.overview_polyline.points;
const distance = leg.distance.text;
const duration = leg.duration.text;

// After (Routes API v2)
const polyline = route.polyline.encodedPolyline;
const distance = formatDistance(route.distanceMeters); // Convert meters
const duration = formatDuration(parseInt(route.duration.replace('s', ''))); // Parse seconds
```

## 🛠️ Code Changes Summary

### Modified Functions
1. **`getRouteBetweenPoints()`**
   - Changed from GET to POST
   - Updated request/response handling
   - Added proper error handling

2. **`getRoutesWithAlternatives()`**
   - Migrated to Routes API v2 structure
   - Enhanced logging for debugging
   - Improved error messages

### New Helper Functions
- `formatDuration()` - Converts seconds to human-readable format
- `formatDistance()` - Converts meters to km/m display
- `buildRouteRequest()` - Creates Routes API v2 request body

## ✅ Testing the Migration

### 1. Test Basic Route Request
```typescript
const origin = { latitude: 37.7749, longitude: -122.4194 };
const destination = { latitude: 37.7849, longitude: -122.4094 };

try {
  const route = await getRouteBetweenPoints(origin, destination, "driving");
  console.log("✅ Migration successful:", route);
} catch (error) {
  console.error("❌ Migration issue:", error);
}
```

### 2. Test Alternative Routes
```typescript
const routes = await getRoutesWithAlternatives(origin, destination, "driving", ["tolls"]);
console.log(`✅ Found ${routes.length} alternative routes`);
```

## 🚨 Common Issues & Solutions

### Issue 1: "Routes API not enabled"
**Solution**: Enable Routes API in Google Cloud Console

### Issue 2: "Field mask required"
**Solution**: Ensure `X-Goog-FieldMask` header is included

### Issue 3: "Invalid travel mode"
**Solution**: Use new travel mode values (DRIVE, WALK, BICYCLE, TRANSIT)

### Issue 4: Response parsing errors
**Solution**: Update response parsing logic for new structure

## 💰 Billing Changes

- Routes API has different pricing than Directions API
- Check [Google Maps Pricing](https://developers.google.com/maps/billing/understanding-cost-of-use) for current rates
- Monitor usage in Google Cloud Console

## 📚 Additional Resources

- [Routes API Overview](https://developers.google.com/maps/documentation/routes/overview)
- [Compute Routes Method](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes)
- [Official Migration Guide](https://developers.google.com/maps/documentation/routes/migration)

## ✨ Benefits After Migration

- ✅ **Better Performance**: Optimized API with field masks
- ✅ **Enhanced Features**: More route preferences and modifiers
- ✅ **Improved Accuracy**: Better traffic data and route quality
- ✅ **Future-Proof**: Modern API with ongoing updates
- ✅ **Better Error Handling**: More descriptive error messages

---

**Migration Date**: December 2024  
**Status**: ✅ Complete  
**Tested**: ✅ All functions working 