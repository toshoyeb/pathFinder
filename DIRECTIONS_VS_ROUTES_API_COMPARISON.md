# Google Directions API vs Routes API v2 Comparison

## 📊 Overview

This document provides a detailed comparison between the legacy Google Directions API and the modern Routes API v2 to help understand the differences, benefits, and migration considerations.

## 🆚 Quick Comparison Table

| Feature | Directions API (Legacy) | Routes API v2 (Modern) |
|---------|------------------------|------------------------|
| **Release** | 2005 | 2023 |
| **Status** | Maintenance mode | Active development |
| **Request Method** | GET | POST |
| **Request Format** | URL parameters | JSON body |
| **Response Format** | JSON | JSON (structured) |
| **Field Selection** | All fields returned | Field masks (optimized) |
| **Travel Modes** | driving, walking, bicycling, transit | DRIVE, WALK, BICYCLE, TRANSIT |
| **Route Alternatives** | Basic | Enhanced with preferences |
| **Traffic Data** | Limited | Advanced real-time |
| **Polyline Encoding** | Standard | Enhanced with options |
| **Error Handling** | Basic status codes | Detailed error objects |
| **Billing** | Per request | Different pricing model |

## 🔍 Detailed Comparison

### 1. API Endpoint & Authentication

#### Directions API (Legacy)
```typescript
// Endpoint
GET https://maps.googleapis.com/maps/api/directions/json

// Authentication
?key=YOUR_API_KEY
```

#### Routes API v2 (Modern)
```typescript
// Endpoint  
POST https://routes.googleapis.com/directions/v2:computeRoutes

// Authentication & Headers
headers: {
  'Content-Type': 'application/json',
  'X-Goog-Api-Key': 'YOUR_API_KEY',
  'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters...'
}
```

### 2. Request Structure

#### Directions API (Legacy)
```typescript
// URL Parameters
const url = `https://maps.googleapis.com/maps/api/directions/json?` +
  `origin=${origin.lat},${origin.lng}&` +
  `destination=${dest.lat},${dest.lng}&` +
  `mode=driving&` +
  `alternatives=true&` +
  `avoid=tolls&` +
  `key=${API_KEY}`;

const response = await axios.get(url);
```

#### Routes API v2 (Modern)
```typescript
// JSON Body
const requestBody = {
  origin: {
    location: {
      latLng: {
        latitude: origin.lat,
        longitude: origin.lng
      }
    }
  },
  destination: {
    location: {
      latLng: {
        latitude: dest.lat,
        longitude: dest.lng
      }
    }
  },
  travelMode: "DRIVE",
  computeAlternativeRoutes: true,
  routeModifiers: {
    avoidTolls: true
  }
};

const response = await axios.post(url, requestBody, { headers });
```

### 3. Travel Modes

#### Directions API (Legacy)
```typescript
mode: "driving" | "walking" | "bicycling" | "transit"
```

#### Routes API v2 (Modern)
```typescript
travelMode: "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"

// Enhanced options
travelMode: "DRIVE",
routeModifiers: {
  vehicleInfo: {
    emissionType: "GASOLINE" | "ELECTRIC" | "HYBRID"
  }
}
```

### 4. Route Preferences & Modifiers

#### Directions API (Legacy)
```typescript
// Limited options
avoid: "tolls" | "highways" | "ferries"
optimize: true/false
```

#### Routes API v2 (Modern)
```typescript
// Enhanced route modifiers
routeModifiers: {
  avoidTolls: boolean,
  avoidHighways: boolean,
  avoidFerries: boolean,
  avoidIndoor: boolean,
  vehicleInfo: {
    emissionType: "GASOLINE" | "ELECTRIC" | "HYBRID",
    engineInfo: { fuelType: "GASOLINE" | "ELECTRIC" | "HYBRID" }
  }
},

// Advanced routing preferences  
routingPreference: "TRAFFIC_UNAWARE" | "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL"
```

### 5. Response Structure

#### Directions API (Legacy)
```typescript
{
  status: "OK" | "NOT_FOUND" | "ZERO_RESULTS" | ...,
  routes: [{
    summary: "I-280 S",
    legs: [{
      duration: { text: "25 mins", value: 1500 },
      distance: { text: "15.2 km", value: 15200 },
      duration_in_traffic: { text: "30 mins", value: 1800 }
    }],
    overview_polyline: { points: "encodedString" },
    bounds: { northeast: {lat, lng}, southwest: {lat, lng} }
  }]
}
```

#### Routes API v2 (Modern)
```typescript
{
  routes: [{
    duration: "1500s",
    distanceMeters: 15200,
    polyline: { encodedPolyline: "encodedString" },
    description: "I-280 S route",
    legs: [{
      duration: "1500s", 
      distanceMeters: 15200,
      startLocation: { latLng: {latitude, longitude} },
      endLocation: { latLng: {latitude, longitude} }
    }],
    viewport: { 
      high: {latitude, longitude}, 
      low: {latitude, longitude} 
    },
    warnings: ["Traffic data may be inaccurate"]
  }]
}
```

### 6. Traffic Data & Real-Time Information

#### Directions API (Legacy)
```typescript
// Basic traffic support
departure_time: "now"
duration_in_traffic: { text: "30 mins", value: 1800 }

// Limited traffic awareness
```

#### Routes API v2 (Modern)
```typescript
// Advanced traffic integration
extraComputations: ["TRAFFIC_ON_POLYLINE"],
routingPreference: "TRAFFIC_AWARE_OPTIMAL",

// Enhanced traffic data
legs: [{
  travelAdvisory: {
    speedReadingIntervals: [...],
    tollInfo: {...},
    fuelConsumptionMicroliters: 2500000
  }
}]
```

### 7. Error Handling

#### Directions API (Legacy)
```typescript
// Simple status-based errors
{
  status: "NOT_FOUND",
  error_message: "Route not found"
}

// Limited error details
if (response.data.status !== "OK") {
  throw new Error(response.data.error_message || "Failed to get directions");
}
```

#### Routes API v2 (Modern)
```typescript
// Detailed error objects
{
  error: {
    code: 400,
    message: "Invalid request: missing origin location",
    status: "INVALID_ARGUMENT",
    details: [{
      "@type": "type.googleapis.com/google.rpc.BadRequest",
      fieldViolations: [{
        field: "origin.location",
        description: "Location is required"
      }]
    }]
  }
}

// Enhanced error handling
if (error.response?.data?.error) {
  const apiError = error.response.data.error;
  throw new Error(`Routes API Error: ${apiError.message} (Code: ${apiError.code})`);
}
```

### 8. Performance & Optimization

#### Directions API (Legacy)
```typescript
// Returns all data (no optimization)
// Fixed response structure
// Limited caching options
```

#### Routes API v2 (Modern)
```typescript
// Field masks for optimized responses
'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'

// Reduced bandwidth usage
// Faster response times
// Better caching support
```

## 💰 Billing & Pricing Differences

### Directions API (Legacy)
- **Basic Routes**: $5 per 1,000 requests
- **Advanced Routes** (with traffic): $10 per 1,000 requests
- Simple pricing model

### Routes API v2 (Modern)
- **Routes Basic**: $6 per 1,000 requests
- **Routes Advanced**: $12 per 1,000 requests  
- **Routes Preferred**: $18 per 1,000 requests
- More granular pricing based on features used

## ⚡ Performance Comparison

| Metric | Directions API | Routes API v2 |
|--------|---------------|---------------|
| **Response Time** | ~300-500ms | ~200-400ms |
| **Response Size** | ~15-25KB | ~8-15KB (with field masks) |
| **Route Quality** | Good | Excellent |
| **Traffic Accuracy** | Basic | Advanced |
| **Alternative Routes** | Limited | Enhanced |

## 🚀 Migration Benefits

### Why Migrate to Routes API v2?

1. **🎯 Better Route Quality**
   - More accurate ETAs
   - Better traffic integration
   - Smarter route optimization

2. **⚡ Improved Performance**  
   - Field masks reduce response size
   - Faster response times
   - Better caching

3. **🛠️ Enhanced Features**
   - More route preferences
   - Advanced vehicle information
   - Better error handling

4. **🔮 Future-Proof**
   - Active development and updates
   - New features added regularly
   - Long-term Google support

5. **📊 Better Analytics**
   - More detailed logging
   - Enhanced debugging capabilities
   - Improved monitoring

## ⚠️ Migration Considerations

### Potential Challenges

1. **💡 Learning Curve**
   - New request/response structure
   - Different field names
   - Enhanced complexity

2. **💰 Cost Changes**
   - Different pricing model
   - Potential cost increase
   - Need to monitor usage

3. **🔧 Code Changes**
   - Significant refactoring required
   - Request/response handling updates
   - Error handling modifications

4. **🧪 Testing Requirements**
   - Extensive testing needed
   - Validation of route quality
   - Performance verification

## 🎯 Recommendation

### For New Projects
- **✅ Use Routes API v2** - Better features, performance, and future support

### For Existing Projects  
- **⚡ Migrate gradually** - Test thoroughly, monitor costs, validate route quality
- **📊 Compare results** - Ensure route quality meets expectations
- **💰 Monitor billing** - Track cost changes during migration

---

**Document Updated**: December 2024  
**pathFinder Migration Status**: ✅ Completed  
**Routes API v2 Adoption**: ✅ Recommended 