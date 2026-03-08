# Wellness Screen APIs Documentation

This document provides comprehensive documentation for all wellness-related APIs in the mobile backend. These APIs power the wellness screen features including Start Session, Asana practices, Meditation, Mindfulness audio, and Sound Escape (soundscapes).

---

## 📁 File Structure

```
arvyax_mobile_backend/src/
├── models/
│   ├── YogaSession.js          - Session JSON models
│   ├── YogaPractice.js         - Practice library (sections/cards)
│   ├── YogaPoseList.js         - Legacy yoga pose list sections/cards
│   ├── Audio.js                - Mindfulness/meditation audio
│   ├── AmbienceAudio.js        - Soundscape audio
│   └── AmbienceCommand.js      - BLE commands for soundscapes
├── controllers/
│   ├── yogaSessionController.js
│   ├── yogaPracticeController.js
│   ├── yogaPoseListController.js
│   ├── audioController.js
│   ├── ambienceAudioController.js
│   └── ambienceCommandController.js
└── routes/
    ├── yogaSessionRoutes.js
    ├── yogaPracticeRoutes.js
  ├── yogaPoseListRoutes.js
    ├── audioRoutes.js
    ├── ambienceAudioRoutes.js
    └── ambienceCommandRoutes.js
```

---

## 🧘 1. Yoga Session APIs (`/api/json/`)

**Purpose**: Manages session JSONs for the "Start Session" feature. Each session contains a complete practice flow with poses, timing, and instructions.

### Routes

#### `GET /api/json/get-yoga-sessions`

**What it does**: Fetches all available yoga session JSONs  
**Returns**: Array of session objects with metadata  
**Use case**: Loading the session selector in wellness screen  
**Response**:

```json
[
  {
    "_id": "...",
    "title": "Morning Flow",
    "sectionId": "S21",
    "uniqueId": "session_001",
    "cardId": "C01",
    "url": "https://r2.../yogaSessions/S21/session_001.json",
    "fileSize": 15240,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### `GET /api/json/get-yoga-sessions/:sectionId`

**What it does**: Fetches sessions filtered by section (Asana, Meditation, etc.)  
**Params**: `sectionId` - Section identifier (e.g., S21, S54)  
**Use case**: Loading sessions for specific wellness category

#### `POST /api/json/upload-yoga-session`

**What it does**: Uploads new session JSON file to cloud storage  
**Body**: `multipart/form-data`

- `jsonFile` (file) - Session JSON file
- `title` (string) - Session name
- `sectionId` (string) - Section ID
- `uniqueId` (string) - Unique session identifier
- `cardId` (string) - Associated card ID  
  **Returns**: Created session with R2 URL  
  **Use case**: Admin dashboard - adding new practice sessions

#### `POST /api/json/upload-yoga-session-url`

**What it does**: Creates session entry with pre-uploaded URL (legacy)  
**Body**: `{ title, sectionId, uniqueId, cardId, url, r2Key, fileSize }`  
**Use case**: Backward compatibility

#### `DELETE /api/json/delete-yoga-session/:id`

**What it does**: Deletes session from database and R2 storage  
**Params**: `id` - MongoDB document ID  
**Returns**: Success message with deletion status

#### `DELETE /api/json/force-delete-yoga-session/:id`

**What it does**: Force deletes session even if R2 deletion fails  
**Use case**: Cleanup when cloud storage is unavailable

#### `PUT /api/json/update-yoga-session/:id`

**What it does**: Updates session metadata (title, IDs)  
**Body**: `{ title, sectionId?, uniqueId?, cardId? }`

#### `GET /api/json/yoga-session-info/:id`

**What it does**: Gets detailed session information  
**Returns**: Complete session object

#### `GET /api/json/test-r2-connection`

**What it does**: Tests cloud storage connectivity  
**Returns**: Connection status and bucket info

---

## 🎴 2. Yoga Practice APIs (`/api/practices/`)

**Purpose**: Manages the practice library structure (sections/cards). Used for browsing Asanas, Meditation poses, and building custom practices.

### Routes

#### `GET /api/practices/get-yoga-practices`

**What it does**: Fetches complete practice library structure  
**Returns**: All sections with cards (Asana, Meditation, Pranayam, Rituals, Warm up)  
**Use case**: Loading the wellness screen practice selector  
**Response structure**:

```json
{
  "practices": [
    {
      "section": "Asana",
      "uniqueId": "S21",
      "cards": [
        {
          "title": "Mountain Pose",
          "repCount": "5",
          "uniqueId": "C01",
          "imagePath": "https://...",
          "cloudinaryId": "...",
          "videoUrl": "https://...",
          "audioUrl": "https://...",
          "audioId": "C01-aud1",
          "exerciseTime": "30s",
          "images": []
        }
      ]
    }
  ],
  "lastSectionCount": 5,
  "lastCardCount": 50
}
```

#### `POST /api/practices/migrate-audio-ids`

**What it does**: Auto-generates audio IDs for cards missing them  
**Returns**: Count of updated items  
**Use case**: Data migration after adding audio feature

#### `POST /api/practices/upload-practice-image`

**What it does**: Adds new practice card with image  
**Body**: `{ title, repCount, section, url, cloudinaryId, id?, videoUrl?, exerciseTime?, audioUrl? }`  
**Returns**: Updated practice structure  
**Use case**: Admin dashboard - adding new pose or meditation card

#### `POST /api/practices/add-section`

**What it does**: Creates new practice section/category  
**Body**: `{ sectionName }`  
**Use case**: Adding custom categories like "Advanced Asanas"

#### `DELETE /api/practices/delete-practice-image/:sectionName/:cardId`

**What it does**: Deletes card from section and Cloudinary  
**Params**: `sectionName`, `cardId`

#### `PUT /api/practices/update-card/:sectionName/:cardId`

**What it does**: Updates card details  
**Body**: `{ title, repCount, videoUrl?, exerciseTime?, audioUrl? }`  
**Use case**: Editing existing pose/meditation card

#### `DELETE /api/practices/delete-section/:sectionName`

**What it does**: Deletes entire section with all cards  
**Returns**: Cloudinary deletion results

### Multi-Image Card Routes

#### `POST /api/practices/upload-card-image/:sectionName/:cardId`

**What it does**: Adds sub-image (variation) to existing card  
**Body**: `{ url, cloudinaryId, audioUrl? }`  
**Use case**: Adding pose variations (A, B, C images)

#### `DELETE /api/practices/delete-card-image/:sectionName/:cardId/:subId`

**What it does**: Deletes specific sub-image  
**Params**: `sectionName`, `cardId`, `subId` (A, B, C, etc.)

#### `PUT /api/practices/update-card-image/:sectionName/:cardId/:subId`

**What it does**: Updates specific sub-image  
**Body**: `{ url, cloudinaryId, audioUrl? }`

---

## 🧘 2A. Legacy Yoga Pose List APIs (`/api/yoga-pose-list`)

**Purpose**: Preserves the old backend yoga pose list contract for clients that still depend on the section-based `YogaPoseList` collection instead of the newer consolidated `YogaPractice` document.

### Routes

#### `GET /api/yoga-pose-list`

**What it does**: Fetches all yoga pose sections sorted by `order` and creation time  
**Returns**: `{ success, data, count }`  
**Use case**: Load the legacy yoga pose list UI without changing the client contract

#### `GET /api/yoga-pose-list/:uniqueId`

**What it does**: Fetches a single yoga pose section by its unique section ID  
**Params**: `uniqueId` - Section identifier such as `S21`

#### `POST /api/yoga-pose-list/section`

**What it does**: Creates a new section document  
**Body**: `{ section, uniqueId, order? }`

#### `POST /api/yoga-pose-list/:sectionId/card-url`

**What it does**: Adds a card to an existing section using a hosted image URL  
**Body**: `{ title, repCount, id, uniqueId, cardId, imageUrl }`  
**Notes**: `imageUrl` is stored in both `imagePath` and `imageUrl` for backward compatibility

#### `PUT /api/yoga-pose-list/:sectionId/card-url/:cardId`

**What it does**: Updates an existing card in a section  
**Body**: `{ title?, repCount?, id?, uniqueId?, imageUrl? }`

#### `DELETE /api/yoga-pose-list/:sectionId/card/:cardId`

**What it does**: Removes a card from a section

#### `PUT /api/yoga-pose-list/:uniqueId`

**What it does**: Updates section metadata  
**Body**: `{ section?, order? }`

#### `DELETE /api/yoga-pose-list/:uniqueId`

**What it does**: Deletes a section document by unique ID

#### `POST /api/yoga-pose-list/reorder`

**What it does**: Bulk updates section order values  
**Body**:

```json
{
  "sections": [
    { "uniqueId": "S21", "order": 1 },
    { "uniqueId": "S54", "order": 2 }
  ]
}
```

---

## 🎧 3. Mindfulness Audio APIs (`/api/audios/`)

**Purpose**: Handles mindfulness, meditation, and breath work audio files. Used for guided meditation, box breathing, sound therapy.

### Routes

#### `GET /api/audios/get-audios`

**What it does**: Fetches all meditation/mindfulness audio files  
**Returns**: Array of audio with thumbnails  
**Use case**: Loading meditation library, breath work exercises

#### `POST /api/audios/upload-audio`

**What it does**: Uploads audio file with optional thumbnail  
**Body**: `multipart/form-data`

- `audioFile` (file) - Audio file (required)
- `thumbnail` (file) - Thumbnail image (optional)
- `title` (string) - Audio title
- `duration` (number) - Duration in seconds  
  **Returns**: Created audio with R2 URLs  
  **Use case**: Adding guided meditation or breath work audio

#### `POST /api/audios/upload-audio-url`

**What it does**: Creates audio entry with pre-uploaded URLs (legacy)  
**Body**: `{ title, url, thumbnailUrl, r2Key, thumbnailR2Key, duration?, fileSize? }`

#### `DELETE /api/audios/delete-audio/:id`

**What it does**: Deletes audio and thumbnail from R2 and database

#### `DELETE /api/audios/force-delete-audio/:id`

**What it does**: Force deletes audio even if R2 fails

#### `PUT /api/audios/update-audio/:id`

**What it does**: Updates audio metadata  
**Body**: `{ title }`

#### `GET /api/audios/audio-info/:id`

**What it does**: Gets detailed audio information

#### `GET /api/audios/test-r2-connection`

**What it does**: Tests R2 storage connectivity

---

## 🌲 4. Ambience Audio APIs (`/api/ambience-audios/`)

**Purpose**: Handles soundscape/ambience audio for "Sound Escape" feature. Includes nature sounds, white noise, ambient music.

### Routes

#### `GET /api/ambience-audios/get-ambience-audios`

**What it does**: Fetches ambience audio with filtering and pagination  
**Query params**:

- `category` - Filter by category
- `tags` - Comma-separated tags (e.g., "rain,forest")
- `limit` - Items per page (default: 50)
- `page` - Page number (default: 1)  
  **Returns**: Paginated soundscape audio list  
  **Use case**: Loading "Sound escape" screen with filters  
  **Example**: `?category=nature&tags=rain,forest&limit=20&page=1`

#### `POST /api/ambience-audios/upload-ambience-audio`

**What it does**: Uploads soundscape audio file  
**Body**: `multipart/form-data`

- `audioFile` (file) - Audio file
- `title` (string) - Audio title
- `duration` (number) - Duration in seconds
- `category` (string) - Category name
- `tags` (string) - Comma-separated tags  
  **Use case**: Adding rain, campfire, ocean sounds, etc.

#### `POST /api/ambience-audios/upload-ambience-audio-url`

**What it does**: Creates ambience audio with URL (legacy)

#### `DELETE /api/ambience-audios/delete-ambience-audio/:id`

**What it does**: Deletes ambience audio from R2 and database

#### `DELETE /api/ambience-audios/force-delete-ambience-audio/:id`

**What it does**: Force deletes even if R2 fails

#### `PUT /api/ambience-audios/update-ambience-audio/:id`

**What it does**: Updates metadata  
**Body**: `{ title, category?, tags? }`

#### `GET /api/ambience-audios/ambience-audio-info/:id`

**What it does**: Gets detailed audio information

#### `GET /api/ambience-audios/ambience-categories`

**What it does**: Lists all available categories  
**Returns**: `{ categories: ["nature", "white-noise", "music"] }`  
**Use case**: Populating category filter dropdown

#### `GET /api/ambience-audios/ambience-tags`

**What it does**: Lists all available tags  
**Returns**: `{ tags: ["rain", "forest", "campfire", "ocean"] }`  
**Use case**: Populating tag filter chips

#### `GET /api/ambience-audios/test-r2-connection`

**What it does**: Tests R2 connection for ambience folder  
**Returns**: Sample files from ambience folder

#### `GET /api/ambience-audios/storage-stats`

**What it does**: Gets storage statistics  
**Returns**: `{ totalAudios, totalSize, averageSize }`  
**Use case**: Admin dashboard monitoring

---

## 💡 5. Ambience Command APIs (`/api/ambience-commands/`)

**Purpose**: Manages BLE/timed commands for soundscape environments. Controls LED lighting, sound mixing, and ambience transitions.

### Routes

#### `GET /api/ambience-commands/ambience-commands`

**What it does**: Lists all environment command configurations  
**Returns**: Array of command sets with metadata  
**Use case**: Loading available soundscape environments  
**Response**:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "environment": "rain",
      "mainDuration": 300,
      "fileName": "rain_commands.json",
      "size": 2048,
      "totalCommands": 25,
      "lastModified": "2024-01-01T00:00:00Z",
      "cloudflareUrl": "https://..."
    }
  ]
}
```

#### `GET /api/ambience-commands/ambience-commands/:environment`

**What it does**: Gets complete command set for environment  
**Params**: `environment` - Environment name (rain, campfire, forest)  
**Returns**: Starting/middle/ending command sequences  
**Use case**: Loading BLE commands when user starts soundscape  
**Response structure**:

```json
{
  "mainDuration": 300,
  "starting": [
    { "second": 0, "value": "FF00AA" },
    { "second": 5, "value": "FF00BB" }
  ],
  "middle": [...],
  "ending": [...]
}
```

#### `POST /api/ambience-commands/ambience-commands`

**What it does**: Creates new environment command set  
**Body**: `{ environment, mainDuration, starting[], middle[], ending[] }`  
**Command format**: `[{ second: number, value: hex_string }]`  
**Use case**: Adding new soundscape environment

#### `PUT /api/ambience-commands/ambience-commands/:environment`

**What it does**: Updates existing command set  
**Body**: `{ mainDuration?, starting[], middle[], ending[] }`  
**Use case**: Modifying BLE sequences

#### `DELETE /api/ambience-commands/ambience-commands/:environment`

**What it does**: Deletes command set from DB and R2

#### `POST /api/ambience-commands/ambience-commands/bulk-upload`

**What it does**: Bulk creates/updates multiple command sets  
**Body**: `{ commands: [{ environment, mainDuration, starting[], middle[], ending[] }] }`  
**Returns**: Summary with success/failure counts  
**Use case**: Importing multiple soundscape configs

#### `GET /api/ambience-commands/ambience-commands/stats/overview`

**What it does**: Gets statistics overview  
**Returns**: `{ totalEnvironments, totalCommands, totalSize, lastUpdated }`  
**Use case**: Admin dashboard

#### `GET /api/ambience-commands/ambience-commands/search/query`

**What it does**: Searches command sets  
**Query params**: `q`, `minDuration`, `maxDuration`  
**Example**: `?q=rain&minDuration=300&maxDuration=600`

---

## 🔗 Integration Guide

### Wellness Screen Flow

1. **Load Practice Library**

   ```
   GET /api/practices/get-yoga-practices
   → Display sections: Asana, Meditation, Pranayam, etc.
   ```

2. **User Selects Card**

   ```
   → Show card details with image, video, audio
   → Allow "Start Session" button
   ```

3. **Start Session**

   ```
   GET /api/json/get-yoga-sessions/:sectionId
   → Fetch available sessions for that section
   → User selects session
   → Download session JSON from URL
   → Execute practice flow
   ```

4. **Mindfulness/Breath Work**

   ```
   GET /api/audios/get-audios
   → Display guided meditations, box breathing audios
   → Play selected audio
   ```

5. **Sound Escape**
   ```
   GET /api/ambience-audios/get-ambience-audios?category=nature
   → Display soundscapes with filtering
   → User selects rain/forest/campfire
   GET /api/ambience-commands/ambience-commands/rain
   → Fetch BLE commands for LED/sound control
   → Play ambience audio + execute BLE commands
   ```

---

## 🛠️ Same Routes as Old Backend

All routes maintain **exact same URLs** as the old backend (`arvyax_back_end`):

- `/api/json/*` - Session routes
- `/api/practices/*` - Practice routes
- `/api/audios/*` - Audio routes
- `/api/ambience-audios/*` - Ambience audio routes
- `/api/ambience-commands/*` - Command routes

**No changes needed in mobile app** - just point to new backend URL!

---

## 📝 Notes

- All file uploads use **Cloudflare R2** for storage
- Images use **Cloudinary** for CDN delivery
- Audio IDs follow format: `{cardId}-{subId?}-aud{index}`
- Section IDs: S01-S99 (e.g., S21 = Asana, S54 = Meditation)
- Card IDs: C01-C99
- Sub IDs: A, B, C, D... (for multi-image cards)

---

## 🎯 Summary

This backend provides a complete wellness API infrastructure supporting:

- ✅ Session management (Start Session JSONs)
- ✅ Practice library (Asana/Meditation cards)
- ✅ Mindfulness audio (guided meditation, breath work)
- ✅ Soundscapes (rain, forest, campfire ambience)
- ✅ BLE commands (LED/sound control for ambience)

All routes are production-ready with proper error handling, cloud storage integration, and comprehensive documentation! 🚀
