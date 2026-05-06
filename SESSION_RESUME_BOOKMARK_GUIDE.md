# Session Resume & Bookmark Navigation - Technical Guide

## Overview

This document explains the best-practice implementation of session resume and bookmark navigation features in the practice and OSCE modules.

## Architecture

### 1. Session Resume (Practice Mode)

The session resume feature allows users to continue exactly where they left off in their practice sessions.

#### Key Components

**State Management:**
- `currentQuestionIndex` - Exact position in question array
- `answeredQuestionIds` - Array of answered question IDs
- `elapsedTime` - Total time spent (in seconds)
- `useTimer` - Whether timer was enabled
- `totalQuestions` - Total questions in session

**Server Functions:**
- `getUserSessionFn` - Retrieves saved session
- `saveUserSessionFn` - Saves current session state
- `deleteUserSessionFn` - Clears session (fresh start)

#### Implementation Details

**Auto-Save (Every 30 seconds):**
```typescript
useEffect(() => {
  if (!selectedCategory || questions.length === 0 || !isTimerRunning) {
    return
  }

  const autoSaveInterval = setInterval(async () => {
    await saveUserSession({
      data: {
        categoryId: selectedCategory.$id,
        lastQuestionIndex: currentQuestionIndex,
        answeredQuestions: answeredQuestionIds,
        elapsedTime,
        useTimer,
        totalQuestions: questions.length,
        isCompleted: false,
      },
    })
  }, 30000) // 30 seconds

  return () => clearInterval(autoSaveInterval)
}, [selectedCategory, currentQuestionIndex, answeredQuestionIds, elapsedTime, useTimer, questions.length, isTimerRunning])
```

**Resume Logic:**
```typescript
if (resume) {
  const session = await getUserSession({
    data: { categoryId: selectedCategory.$id },
  })
  
  if (session.session) {
    // Restore exact state
    const savedIndex = session.session.lastQuestionIndex || 0
    const validIndex = Math.min(savedIndex, allQs.length - 1)
    
    setCurrentQuestionIndex(validIndex)
    setElapsedTime(session.session.elapsedTime || 0)
    setUseTimer(session.session.useTimer || false)
    setAnsweredQuestionIds(session.session.answeredQuestions || [])
    
    // Show detailed feedback
    const answeredCount = session.session.answeredQuestions?.length || 0
    const minutes = Math.floor(timeSpent / 60)
    const seconds = timeSpent % 60
    
    toast.success(
      `Session resumed! Question ${validIndex + 1}/${allQs.length} • ${answeredCount} answered • ${minutes}m ${seconds}s`,
      { duration: 4000 }
    )
  }
}
```

**Fresh Start Logic:**
```typescript
if (!resume) {
  // Delete existing session
  await deleteUserSession({
    data: { categoryId: selectedCategory.$id },
  })
  
  // Start from beginning
  setCurrentQuestionIndex(0)
  setElapsedTime(0)
  setAnsweredQuestionIds([])
  
  toast.success('Starting fresh from question 1!')
}
```

**Save & Exit:**
```typescript
const handleSaveAndExit = async () => {
  await saveUserSession({
    data: {
      categoryId: selectedCategory.$id,
      lastQuestionIndex: currentQuestionIndex,
      answeredQuestions: answeredQuestionIds,
      elapsedTime,
      useTimer,
      totalQuestions: questions.length,
      isCompleted: false,
    },
  })
  
  const answeredCount = answeredQuestionIds.length
  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60
  
  toast.success(
    `Session saved! Progress: ${currentQuestionIndex + 1}/${questions.length} • ${answeredCount} answered • ${minutes}m ${seconds}s`,
    { duration: 4000 }
  )
  
  exitPractice()
}
```

### 2. Bookmark Navigation

Bookmark navigation allows users to jump directly to a specific question or OSCE topic from the bookmarks page.

#### URL Search Parameters

**Practice (MCQ):**
```typescript
/dashboard/practice?question=<questionId>&pool=<poolNumber>
```

**OSCE:**
```typescript
/dashboard/osce?topic=<topicId>
```

#### Implementation Flow

**1. Bookmarks Page - Navigation Trigger:**
```typescript
const handleBookmarkClick = (bookmark: EnrichedBookmark) => {
  if (bookmark.itemType === 'mcq') {
    void navigate({
      to: '/dashboard/practice',
      search: {
        question: bookmark.itemId,
        pool: bookmark.poolNumber?.toString(),
      },
    })
  } else if (bookmark.itemType === 'osce') {
    void navigate({
      to: '/dashboard/osce',
      search: {
        topic: bookmark.itemId,
      },
    })
  }
}
```

**2. Route Configuration - Search Schema:**
```typescript
const searchSchema = z.object({
  question: z.string().optional(),
  pool: z.string().optional(),
})

export const Route = createFileRoute('/_protected/dashboard/practice')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    return {
      // ... other data
      bookmarkQuestionId: search.question,
      bookmarkPoolNumber: search.pool ? parseInt(search.pool) : undefined,
    }
  },
})
```

**3. Practice Page - Bookmark Navigation Effect:**
```typescript
useEffect(() => {
  if (bookmarkQuestionId && bookmarkPoolNumber) {
    // Find category containing this pool
    const category = categories.find(
      (c: Categories) =>
        c.poolNumbers && c.poolNumbers.includes(bookmarkPoolNumber),
    )

    if (category) {
      setSelectedCategory(category)
      pendingActionRef.current = 'bookmark'
      setTriggerPractice((prev) => prev + 1)
    } else {
      toast.error('Category not found for this question')
      void navigate({ to: '/dashboard/practice', search: {} })
    }
  }
}, [bookmarkQuestionId, bookmarkPoolNumber, categories, navigate])
```

**4. Execute Bookmark Jump:**
```typescript
const executePracticeStart = async (resume: boolean, bookmarkMode = false) => {
  // ... load questions
  
  if (bookmarkMode && bookmarkQuestionId) {
    const questionIndex = allQs.findIndex(
      (q) => q.$id === bookmarkQuestionId,
    )
    
    if (questionIndex !== -1) {
      setCurrentQuestionIndex(questionIndex)
      setUseTimer(false)
      setElapsedTime(0)
      setAnsweredQuestionIds([])
      
      toast.success(
        `Jumped to bookmarked question ${questionIndex + 1} of ${allQs.length}`,
      )
      
      // Clear search params after navigation
      void navigate({ to: '/dashboard/practice', search: {} })
    } else {
      toast.error('Bookmarked question not found in this category')
      setCurrentQuestionIndex(0)
    }
    
    setIsTimerRunning(false)
    return
  }
}
```

**5. OSCE Page - Bookmark Navigation:**
```typescript
useEffect(() => {
  if (bookmarkTopicId) {
    const topic = topics.find((t: OsceTopics) => t.$id === bookmarkTopicId)
    
    if (topic) {
      handleSelectTopic(topic)
      toast.success(`Jumped to bookmarked topic: ${topic.title}`)
      
      // Clear search params after navigation
      void navigate({ to: '/dashboard/osce', search: {} })
    }
  }
}, [bookmarkTopicId, topics, navigate])
```

## Best Practices

### 1. State Restoration Accuracy
✅ **DO:** Save and restore exact indices, not relative positions
✅ **DO:** Validate indices are within bounds before setting
✅ **DO:** Preserve all session state (timer, answered questions, elapsed time)

❌ **DON'T:** Use approximate positions or percentages
❌ **DON'T:** Assume question order remains constant

### 2. User Feedback
✅ **DO:** Show detailed progress info in toasts
✅ **DO:** Include question numbers, answered count, and time
✅ **DO:** Use appropriate toast durations (4000ms for detailed info)

❌ **DON'T:** Use generic "Session saved" messages
❌ **DON'T:** Hide important progress information

### 3. URL Parameter Handling
✅ **DO:** Clear search params after successful navigation
✅ **DO:** Validate search params exist before processing
✅ **DO:** Handle missing/invalid params gracefully

❌ **DON'T:** Leave search params in URL after navigation
❌ **DON'T:** Assume search params are always valid

### 4. Auto-Save Strategy
✅ **DO:** Auto-save every 30 seconds during active sessions
✅ **DO:** Only auto-save when timer is running
✅ **DO:** Log auto-save events for debugging

❌ **DON'T:** Auto-save too frequently (causes performance issues)
❌ **DON'T:** Auto-save when session is paused

### 5. Bookmark Navigation Flow
✅ **DO:** Use URL search parameters for deep linking
✅ **DO:** Find the correct category/pool before loading questions
✅ **DO:** Disable timer for bookmark jumps (user is reviewing)

❌ **DON'T:** Navigate without validating the target exists
❌ **DON'T:** Start timer automatically on bookmark navigation

## Data Flow Diagrams

### Session Resume Flow
```
User clicks "Resume Previous"
    ↓
getUserSession(categoryId)
    ↓
Session exists? → YES → Restore state (index, time, answered)
    ↓                    ↓
    NO                   Show detailed resume toast
    ↓                    ↓
Start fresh at Q1        Start timer
    ↓
Show "No session" toast
```

### Bookmark Navigation Flow
```
User clicks bookmark
    ↓
Navigate with search params (?question=X&pool=Y)
    ↓
Route loader extracts params
    ↓
Component mounts with params
    ↓
useEffect detects params
    ↓
Find category by pool number
    ↓
Category found? → YES → Load questions
    ↓                    ↓
    NO                   Find question by ID
    ↓                    ↓
Show error toast         Jump to question index
    ↓                    ↓
Clear params             Show success toast
                         ↓
                         Clear params
```

## Testing Checklist

### Session Resume
- [ ] Resume from middle of session (index > 0)
- [ ] Resume with timer enabled/disabled
- [ ] Resume with some questions answered
- [ ] Resume after auto-save
- [ ] Fresh start deletes existing session
- [ ] Save & Exit preserves exact state
- [ ] Auto-save runs every 30 seconds
- [ ] Auto-save stops when timer paused

### Bookmark Navigation
- [ ] MCQ bookmark navigates to correct question
- [ ] OSCE bookmark navigates to correct topic
- [ ] Invalid bookmark shows error
- [ ] Search params cleared after navigation
- [ ] Timer disabled on bookmark jump
- [ ] Question index calculated correctly
- [ ] Category found by pool number
- [ ] Handles missing category gracefully

## Performance Considerations

1. **Auto-Save Interval:** 30 seconds balances data safety with server load
2. **Search Param Cleanup:** Prevents re-triggering navigation on refresh
3. **Index Validation:** Prevents out-of-bounds errors
4. **Async Operations:** All server calls use proper async/await
5. **State Updates:** Batched where possible to minimize re-renders

## Error Handling

All operations include try-catch blocks with user-friendly error messages:

```typescript
try {
  await saveUserSession({ data: sessionData })
  toast.success('Session saved!')
} catch (error) {
  console.error('Save failed:', error)
  toast.error('Failed to save session')
}
```

## Future Enhancements

1. **Offline Support:** Cache session state in localStorage as backup
2. **Multi-Device Sync:** Detect session conflicts across devices
3. **Session History:** Allow users to view past sessions
4. **Smart Resume:** Suggest resuming based on recent activity
5. **Bookmark Collections:** Group bookmarks into custom collections

## Conclusion

This implementation follows best practices for:
- Exact state restoration
- User-friendly feedback
- Robust error handling
- Performance optimization
- Deep linking support

The combination of auto-save, manual save, and bookmark navigation provides a seamless user experience for medical exam preparation.
