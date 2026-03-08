# Wellness APIs - Quick Reference

## 📂 Files Created

### Models (src/models/)

1. **YogaSession.js** - Session JSONs (Start Session feature)
2. **YogaPractice.js** - Practice library structure (Asana/Meditation cards)
3. **YogaPoseList.js** - Legacy yoga pose list sections/cards
4. **Audio.js** - Mindfulness/meditation audio
5. **AmbienceAudio.js** - Soundscape audio (Sound Escape)
6. **AmbienceCommand.js** - BLE commands for soundscapes

### Controllers (src/controllers/)

1. **yogaSessionController.js** - Session JSON management
2. **yogaPracticeController.js** - Practice card operations
3. **yogaPoseListController.js** - Legacy yoga pose list operations
4. **audioController.js** - Mindfulness audio operations
5. **ambienceAudioController.js** - Soundscape audio operations
6. **ambienceCommandController.js** - BLE command management

### Routes (src/routes/)

1. **yogaSessionRoutes.js** → `/api/json/*`
2. **yogaPracticeRoutes.js** → `/api/practices/*`
3. **yogaPoseListRoutes.js** → `/api/yoga-pose-list*`
4. **audioRoutes.js** → `/api/audios/*`
5. **ambienceAudioRoutes.js** → `/api/ambience-audios/*`
6. **ambienceCommandRoutes.js** → `/api/ambience-commands/*`

---

## 🎯 Wellness Screen Features Covered

### 1. **Start Session**

- **Routes**: `/api/json/*`
- **What**: Complete practice session JSONs with poses, timing, instructions
- **Storage**: Cloudflare R2
- **Use**: User clicks "Start Session" → loads session JSON → follows practice flow

### 2. **Asana (Poses)**

- **Routes**: `/api/practices/*`
- **What**: Browse & select yoga poses with images, videos, audio
- **Storage**: Cloudinary (images) + metadata in MongoDB
- **Use**: User browses Asana section → selects pose card → views details

### 3. **Meditation**

- **Routes**: `/api/practices/*` (cards) + `/api/audios/*` (audio)
- **What**: Meditation poses & guided meditation audio
- **Storage**: Cloudinary (images) + R2 (audio)
- **Use**: User selects meditation → plays guided audio

### 3A. **Legacy Yoga Pose List**

- **Routes**: `/api/yoga-pose-list*`
- **What**: Preserved old-backend yoga pose section/card CRUD contract
- **Storage**: MongoDB (`YogaPoseList` collection)
- **Use**: Existing clients can keep calling the same yoga pose list endpoints after moving to the mobile backend

### 4. **Mindfulness / Box Breathing**

- **Routes**: `/api/audios/*`
- **What**: Guided breath work, mindfulness exercises
- **Storage**: Cloudflare R2 (audio + thumbnails)
- **Use**: User selects breath work exercise → plays audio guide

### 5. **Sound Escape (Soundscapes)**

- **Routes**: `/api/ambience-audios/*` + `/api/ambience-commands/*`
- **What**: Nature sounds with BLE-controlled lighting/ambience
- **Storage**: R2 (audio) + R2 (command JSONs)
- **Use**: User selects rain/forest/campfire → plays audio + sends BLE commands

---

## 🔗 API Endpoints Summary

### Session Management (`/api/json/`)

```
GET    /get-yoga-sessions              - List all sessions
GET    /get-yoga-sessions/:sectionId   - Sessions by section
POST   /upload-yoga-session            - Upload session JSON
DELETE /delete-yoga-session/:id        - Delete session
PUT    /update-yoga-session/:id        - Update session metadata
```

### Practice Library (`/api/practices/`)

```
GET    /get-yoga-practices             - Full practice structure
POST   /upload-practice-image          - Add new pose/card
POST   /add-section                    - Create new section
PUT    /update-card/:section/:cardId   - Update card details
DELETE /delete-practice-image/:section/:cardId - Delete card
POST   /upload-card-image/:section/:cardId     - Add sub-image
```

### Legacy Yoga Pose List (`/api/yoga-pose-list`)

```
GET    /api/yoga-pose-list                     - List all sections
GET    /api/yoga-pose-list/:uniqueId           - Get one section
POST   /api/yoga-pose-list/section             - Create section
POST   /api/yoga-pose-list/:sectionId/card-url - Add card with image URL
PUT    /api/yoga-pose-list/:sectionId/card-url/:cardId - Update card
DELETE /api/yoga-pose-list/:sectionId/card/:cardId     - Delete card
PUT    /api/yoga-pose-list/:uniqueId           - Update section
DELETE /api/yoga-pose-list/:uniqueId           - Delete section
POST   /api/yoga-pose-list/reorder             - Reorder sections
```

### Mindfulness Audio (`/api/audios/`)

```
GET    /get-audios                     - List all meditation audio
POST   /upload-audio                   - Upload meditation audio
DELETE /delete-audio/:id               - Delete audio
PUT    /update-audio/:id               - Update audio metadata
```

### Soundscape Audio (`/api/ambience-audios/`)

```
GET    /get-ambience-audios            - List soundscapes (filterable)
POST   /upload-ambience-audio          - Upload soundscape audio
DELETE /delete-ambience-audio/:id      - Delete soundscape
GET    /ambience-categories            - List categories
GET    /ambience-tags                  - List tags
GET    /storage-stats                  - Storage statistics
```

### BLE Commands (`/api/ambience-commands/`)

```
GET    /ambience-commands              - List all environments
GET    /ambience-commands/:environment - Get environment commands
POST   /ambience-commands              - Create command set
PUT    /ambience-commands/:environment - Update commands
DELETE /ambience-commands/:environment - Delete commands
POST   /ambience-commands/bulk-upload  - Bulk import
GET    /ambience-commands/stats/overview - Statistics
```

---

## ✅ What's Maintained from Old Backend

✓ **Exact same route URLs** - no mobile app changes needed  
✓ **Same request/response formats**  
✓ **Same MongoDB schemas**  
✓ **Same Cloudflare R2 integration**  
✓ **Same Cloudinary integration**  
✓ **Same error handling patterns**  
✓ **Same validation logic**  
✓ **Same yoga pose list path contract**

---

## 🆕 Improvements in New Structure

✓ **Proper MVC separation** (models/controllers/routes)  
✓ **Comprehensive documentation** in every file  
✓ **Clear function naming** and comments  
✓ **Consistent error handling**  
✓ **Better code organization**  
✓ **Easier to maintain & extend**

---

## 🚀 Next Steps to Use

1. **Register routes in main app.js**:

```javascript
const yogaSessionRoutes = require("./routes/yogaSessionRoutes");
const yogaPracticeRoutes = require("./routes/yogaPracticeRoutes");
const audioRoutes = require("./routes/audioRoutes");
const ambienceAudioRoutes = require("./routes/ambienceAudioRoutes");
const ambienceCommandRoutes = require("./routes/ambienceCommandRoutes");

app.use("/api/json", yogaSessionRoutes);
app.use("/api/practices", yogaPracticeRoutes);
app.use("/api/audios", audioRoutes);
app.use("/api/ambience-audios", ambienceAudioRoutes);
app.use("/api/ambience-commands", ambienceCommandRoutes);
```

2. **Ensure config/constants.js has**:

```javascript
{
  (R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_ENDPOINT,
    R2_BUCKET_NAME,
    R2_PUBLIC_URL,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET);
}
```

3. **Test endpoints** with Postman or mobile app

---

## 📖 Full Documentation

See **WELLNESS_API_DOCUMENTATION.md** for:

- Detailed route explanations
- Request/response examples
- Integration guides
- Use case scenarios
- Error handling details

---

**All wellness APIs are ready to use! 🎉**
