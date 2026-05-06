# Session Resumption & Bookmark Navigation Enhancements

## Overview

This document describes the enhanced session resumption and bookmark navigation features implemented to provide users with precise, state-preserving practice sessions and direct navigation to bookmarked content.

## ✨ Key Features

### 1. Enhanced Session Resumption (MCQ Practice)

#### What Was Improved:
- **Exact State Restoration**: When resuming a session, the system now restores:
  - Exact question index (where you stopped)
  - All answered questions list
  - Timer state (enabled/disabled)
  - Elapsed time (down to the second)
  - Total questions count

#### How It Works:
```typescript
// Session data structure
{
  categoryId: string,
  lastQuestionIndex: number,        // Exact question position
  answeredQuestions: string[],      // All answered question IDs
  useTimer: boolean,                // Timer preference
  elapsedTime: number,              // Time in seconds
  totalQuestions: number,           // Total questions in session
  isCompleted: boolean              // Completion status
}
```

#### User Experience:
1. **Starting Practice**:
   - User selects a category
   - Dialog shows "Resume Previous" or "Start Fresh" options
   - Timer toggle available

2. **Resuming Session**:
   - Loads exact question where user stopped
   - Restores timer state and elapsed time
   - Shows detailed toast: "Session resumed! Question 15/50 • 12 answered • 8m 45s"
   - All previously answered questions are marked

3. **Saving Session**:
   - Auto-saves on "Save & Exit"
   - Stores complete state for perfect resumption
   - Shows detailed toast: "Session saved! Progress: 15/50 • 12 answered • 8m 45s"

### 2. Direct Bookmark Navigation (MCQ)

#### What Was Implemented:
- **URL-Based Navigation**: Bookmarks pass question ID and pool number via URL params
- **Automatic Category Detection**: System finds the correct category containing the question
- **Instant Question Jump**: Opens practice mode directly at the bookmarked question

#### How It Works:
```typescript
// Bookmark click navigation
navigate({
  to: '/dashboard/practice',
  search: {
    question: 'question-id-123',
    pool: '5'
  }
})

// Practice page receives and processes
1. Finds category containing pool number 5
2. Loads all questions from that category
3. Finds exact question by ID
4. Jumps directly to that question
5. Clears URL params after navigation
```

#### User Experience:
1. User clicks bookmark in Bookmarks page
2. System automatically:
   - Finds the correct category
   - Loads all questions
   - Jumps to exact bookmarked question
   - Shows toast: "Jumped to bookmarked question 23 of 150"
3. User can immediately view and practice from that question

### 3. Direct Bookmark Navigation (OSCE)

#### What Was Implemented:
- **Topic-Based Navigation**: Bookmarks pass topic ID via URL params
- **Instant Topic Display**: Opens OSCE topic directly in practice view

#### How It Works:
```typescript
// Bookmark click navigation
navigate({
  to: '/dashboard/osce',
  search: {
    topic: 'topic-id-456'
  }
})

// OSCE page receives and processes
1. Finds topic by ID
2. Opens topic in practice view
3. Clears URL params after navigation
```

#### User Experience:
1. User clicks OSCE bookmark
2. System automatically:
   - Finds the topic
   - Opens it in practice view
   - Shows toast: "Jumped to bookmarked topic: Acute Chest Pain"
3. User can immediately start practicing interactions

## 🔧 Technical Implementation

### Session Management

#### Server Functions (`src/server/functions/sessions.ts`):
- `getUserSessionFn`: Retrieves existing session for a category
- `saveUserSessionFn`: Saves/updates session with complete state
- `deleteUserSessionFn`: Clears session for fresh start
- `getUserSessionStatsFn`: Provides session statistics

#### State Management (`src/routes/_protected/dashboard/practice.tsx`):
```typescript
// Session state
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([])
const [elapsedTime, setElapsedTime] = useState(0)
const [useTimer, setUseTimer] = useState(false)

// Resume logic
if (session.session) {
  const validIndex = Math.min(savedIndex, allQs.length - 1)
  setCurrentQuestionIndex(validIndex)
  setElapsedTime(session.session.elapsedTime || 0)
  setUseTimer(session.session.useTimer || false)
  setAnsweredQuestionIds(session.session.answeredQuestions || [])
}
```

### Bookmark Navigation

#### URL Schema Validation:
```typescript
// MCQ Practice
const searchSchema = z.object({
  category: z.string().optional(),
  question: z.string().optional(),
  pool: z.string().optional(),
})

// OSCE Practice
const searchSchema = z.object({
  topic: z.string().optional(),
})
```

#### Navigation Flow:
1. **Bookmark Click** → URL params set
2. **Page Loader** → Receives search params
3. **Component Mount** → useEffect detects params
4. **Auto-Navigation** → Finds and jumps to content
5. **Cleanup** → Clears URL params

## 📊 Data Flow Diagrams

### Session Resumption Flow:
```
User Selects Category
        ↓
Dialog: Resume or Fresh?
        ↓
    [Resume]
        ↓
getUserSessionFn()
        ↓
Load Session Data
        ↓
Restore Complete State:
  - Question Index
  - Answered Questions
  - Timer State
  - Elapsed Time
        ↓
User Continues Practice
        ↓
Save & Exit
        ↓
saveUserSessionFn()
        ↓
Complete State Saved
```

### Bookmark Navigation Flow (MCQ):
```
User Clicks Bookmark
        ↓
Navigate with params:
  ?question=id&pool=5
        ↓
Practice Page Loader
        ↓
Find Category (pool=5)
        ↓
Load All Questions
        ↓
Find Question by ID
        ↓
Jump to Question Index
        ↓
Clear URL Params
        ↓
User Practices
```

## 🎯 Best Practices Implemented

### 1. State Preservation
- ✅ Complete state saved (not just position)
- ✅ Atomic updates (all or nothing)
- ✅ Validation on restore (bounds checking)

### 2. User Feedback
- ✅ Detailed toast messages
- ✅ Progress indicators
- ✅ Clear action confirmations

### 3. Error Handling
- ✅ Graceful fallbacks (missing session → start fresh)
- ✅ Validation (question exists, category exists)
- ✅ User-friendly error messages

### 4. Performance
- ✅ Efficient queries (indexed lookups)
- ✅ Minimal re-renders (useCallback, useMemo)
- ✅ Debounced saves (prevent spam)

### 5. URL Management
- ✅ Clean URLs (params cleared after use)
- ✅ Schema validation (type-safe params)
- ✅ Shareable links (params work on refresh)

## 🔍 Testing Scenarios

### Session Resumption:
1. ✅ Start practice → Answer 10 questions → Save & Exit → Resume → Verify exact position
2. ✅ Enable timer → Practice 5 min → Save → Resume → Verify timer continues
3. ✅ Answer questions → Save → Resume → Verify answered questions marked
4. ✅ Start fresh → Verify session cleared and starts at question 1

### Bookmark Navigation (MCQ):
1. ✅ Bookmark question 50 → Click bookmark → Verify jumps to question 50
2. ✅ Bookmark from pool 3 → Click → Verify correct category loaded
3. ✅ Bookmark deleted question → Click → Verify error message
4. ✅ Multiple bookmarks → Click each → Verify correct navigation

### Bookmark Navigation (OSCE):
1. ✅ Bookmark topic → Click → Verify topic opens
2. ✅ Bookmark deleted topic → Click → Verify error message
3. ✅ Multiple bookmarks → Click each → Verify correct topic

## 📝 Code Locations

### Session Management:
- **Server Functions**: `src/server/functions/sessions.ts`
- **Practice Page**: `src/routes/_protected/dashboard/practice.tsx`
  - Lines: Session state management
  - Lines: `executePracticeStart` function
  - Lines: `handleSaveAndExit` function

### Bookmark Navigation:
- **Bookmarks Page**: `src/routes/_protected/dashboard/bookmarks.tsx`
  - Lines: `handleBookmarkClick` function
- **Practice Page**: `src/routes/_protected/dashboard/practice.tsx`
  - Lines: Search schema validation
  - Lines: Bookmark navigation useEffect
- **OSCE Page**: `src/routes/_protected/dashboard/osce.tsx`
  - Lines: Search schema validation
  - Lines: Bookmark navigation useEffect

## 🚀 Future Enhancements

### Potential Improvements:
1. **Auto-Save**: Periodic auto-save during practice (every 30s)
2. **Multiple Sessions**: Support multiple concurrent sessions per user
3. **Session History**: View and restore from previous sessions
4. **Sync Across Devices**: Cloud sync for session state
5. **Offline Support**: Local storage fallback for offline practice
6. **Analytics**: Track session completion rates and patterns

## 📚 Related Documentation

- **Session Functions**: See `src/server/functions/sessions.ts`
- **Bookmark Functions**: See `src/server/functions/bookmarks.ts`
- **Practice Page**: See `src/routes/_protected/dashboard/practice.tsx`
- **OSCE Page**: See `src/routes/_protected/dashboard/osce.tsx`
- **Bookmarks Page**: See `src/routes/_protected/dashboard/bookmarks.tsx`

---

**Last Updated**: January 27, 2026
**Status**: ✅ Fully Implemented and Tested
