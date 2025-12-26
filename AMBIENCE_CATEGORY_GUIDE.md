# Ambience Category Theme Selection System

## Overview

Complete theme selection system allowing users to choose from 27 themes across 6 ambience categories (Nature, Urban, Cozy, Meditation, Sleep, Focus). Users can select only ONE theme at a time, with full tracking and profile integration.

## Seed Data

**6 Categories with 27 Total Themes:**

### 1. **Nature** (5 themes)

- Forest, River, Mountain, Ocean Waves, Rainforest

### 2. **Urban** (4 themes)

- Coffee Shop, Library, City Rain, Bustling Street

### 3. **Cozy** (4 themes)

- Fireplace, Candlelit Room, Rainy Night, Warm Cabin

### 4. **Meditation** (5 themes)

- Zen Garden, Tibetan Bowls, Mantra Om, Chakra Healing, Crystal Bowls

### 5. **Sleep** (5 themes)

- Gentle Rain, Distant Thunder, Lullabies, White Noise, Heartbeat

### 6. **Focus** (4 themes)

- Lo-fi Beats, Classical Piano, Ambient Synth, Nature Focus

## API Endpoints

### Public Endpoints (No Auth Required)

**GET `/api/ambience-categories`**

- Get all active ambience categories
- Returns: List of 6 categories with themes

**GET `/api/ambience-categories/themes`**

- Get all themes from all categories (flattened)
- Returns: Array of 27 themes with full details (id, name, imageUrl, categoryId, categoryName)
- **Use this to get themeId for selections**

**GET `/api/ambience-categories/themes/:themeId`**

- Get specific theme details
- Returns: Single theme with parent category information

**GET `/api/ambience-categories/:categoryId`**

- Get specific category with all its themes
- Returns: Category object with themes array

### Protected Endpoints (Auth Required - Bearer Token)

**POST `/api/ambience-categories/user/select-theme/:themeId`**

- User selects a theme
- Only 1 theme allowed per user (replaces previous)
- Returns:
  ```json
  {
    "message": "Theme selected successfully",
    "selectedTheme": {
      "id": "...",
      "name": "Forest",
      "imageUrl": "...",
      "categoryId": "...",
      "categoryName": "Nature"
    },
    "user": {
      "userId": "...",
      "email": "...",
      "selectedTheme": { ... }
    }
  }
  ```

**GET `/api/ambience-categories/user/selected-theme`**

- Get user's currently selected theme
- Returns: Theme details or `null` if none selected
- Auto-cleans up if previously selected theme was deleted

**DELETE `/api/ambience-categories/user/selected-theme`**

- Deselect/remove user's current theme
- Returns: Success message

## User Profile Integration

The `UserModel.getProfileWithTheme()` method returns user profile with embedded theme:

```json
{
  "userId": "...",
  "username": "...",
  "email": "...",
  "phoneNumber": "...",
  "photoUrl": "...",
  "preferences": {
    "nickname": "...",
    "gender": "...",
    "dob": "...",
    "isQnaFilled": true/false
  },
  "selectedTheme": {
    "themeId": "...",
    "themeName": "Forest",
    "themeImageUrl": "https://...",
    "categoryId": "...",
    "categoryName": "Nature"
  },
  "badges": [...],
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Features

✅ **One Theme Per User** - Enforced at model and route level
✅ **27 Themes** - Across 6 categories with placeholder images
✅ **Theme Tracking** - Full details stored in user profile
✅ **Auto-Cleanup** - If selected theme is deleted, user selection is cleared
✅ **Full Validation** - Theme and category active status verified
✅ **Auth Protected** - User selection routes require Bearer token
✅ **Public Discovery** - Category/theme browsing doesn't require auth

## Usage Flow

```
1. Get all categories: GET /api/ambience-categories
   ↓
2. Browse themes: GET /api/ambience-categories/themes
   ↓
3. User selects theme: POST /api/ambience-categories/user/select-theme/{themeId}
   ↓
4. Get user profile: user.getProfileWithTheme()
   → Shows selectedTheme with image URL
   ↓
5. Display selected theme with image to user
```

## Testing with Postman

1. **Get all themes**: GET `/api/ambience-categories/themes`
2. **Copy a theme ID** from the response
3. **Select theme**: POST `/api/ambience-categories/user/select-theme/{themeId}` (with Bearer token)
4. **Check selection**: GET `/api/ambience-categories/user/selected-theme` (with Bearer token)
5. **Deselect**: DELETE `/api/ambience-categories/user/selected-theme` (with Bearer token)

## Database Schema

### AmbienceCategory

```javascript
{
  name: String (unique),
  description: String,
  themes: [
    {
      name: String,
      imageUrl: String,
      isActive: Boolean (default: true),
      order: Number
    }
  ],
  isActive: Boolean (default: true),
  order: Number,
  timestamps: true
}
```

### User.preferences

```javascript
ambienceSelections: [
  {
    categoryId: ObjectId (ref: AmbienceCategory),
    themeId: ObjectId (theme._id)
  }
],
// Validates: maximum 1 selection allowed
```

## Files Modified/Created

- ✅ `src/models/AmbienceCategory.js` - Added helper methods
- ✅ `src/models/UserModel.js` - Added `getProfileWithTheme()` method
- ✅ `src/routes/AmbienceCategoryRoutes.js` - Added 3 user selection routes
- ✅ `src/scripts/seedAmbienceCategories.js` - Seed script with 6 categories + 27 themes
- ✅ `postman/Arvyax_Mobile_Backend.postman_collection.json` - All endpoints documented

## Ready to Deploy! 🎯
