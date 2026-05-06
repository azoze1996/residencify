# 🚀 Residencify - Quick Start Guide

## 📋 What You Need to Know

**Residencify** is a medical exam preparation platform for residents. This guide gets you up to speed quickly.

---

## 🎯 Core Concept

**Purpose**: Help medical residents practice MCQ questions and OSCE scenarios

**Users**:
- **Students** - Practice questions, track progress
- **Instructors** - Create quizzes, manage students  
- **Admins** - Manage everything

---

## 🔑 Key Features (Quick List)

1. **MCQ Practice** - Answer questions by category, track progress
2. **OSCE Scenarios** - Review clinical cases
3. **Bookmarks** - Save questions for later
4. **Sharing** - Share questions with connected peers
5. **Progress Tracking** - See your improvement over time
6. **Instructor Quizzes** - Custom quizzes for students
7. **Admin Dashboard** - Manage users, content, support

---

## 🏃 Quick Workflows

### Student Workflow
```
Sign Up → Get Activated → Browse Categories → Start Practice → 
Answer Questions → Review Explanations → Track Progress → 
Bookmark Important Ones → Share with Peers
```

### Instructor Workflow
```
Sign In → Create Quiz → Add Questions → Invite Students → 
Students Take Quiz → Review Results → Provide Feedback
```

### Admin Workflow
```
Sign In → Manage Users → Add Questions → Create Categories → 
Handle Support → Send Notifications
```

---

## 📱 Main Pages

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Marketing, registration |
| Sign In | `/sign-in` | Authentication |
| Dashboard | `/dashboard` | Overview, stats |
| Practice | `/dashboard/practice` | MCQ questions |
| OSCE | `/dashboard/osce` | Clinical scenarios |
| Bookmarks | `/dashboard/bookmarks` | Saved items |
| Sharing | `/dashboard/sharing` | Peer collaboration |
| Settings | `/dashboard/settings` | User preferences |
| Admin | `/admin` | Admin dashboard |

---

## 🗄️ Database (Simplified)

**Core Tables**:
- `users` - User accounts
- `plans` - Subscription plans
- `questions` - MCQ question bank
- `categories` - Question organization
- `user_sessions` - Practice sessions
- `bookmarks` - Saved questions/OSCE
- `osce_topics` - Clinical scenarios

**Collaboration**:
- `user_connections` - Peer connections
- `shared_questions` - Shared content
- `flagged_questions` - Flagged for review

**Instructor**:
- `instructor_quizzes` - Custom quizzes
- `instructor_questions` - Quiz questions
- `instructor_students` - Student groups
- `quiz_attempts` - Student attempts

**System**:
- `feedback` - Question feedback
- `support_tickets` - User support
- `notifications` - System messages
- `interest_registrations` - Pre-launch signups

---

## 🔧 Recent Changes (Latest Session)

### 1. Registration Form Enhanced
- Now collects: name, email, **specialty**, **PGY level**
- Better user segmentation
- File: `src/components/landing/CTA.tsx`

### 2. Footer Centralized
- All content centered for better design
- File: `src/components/landing/Footer.tsx`

### 3. Dashboard Cleaned
- Removed "Plan Status" card
- Now shows 3 cards: Questions, Topics, Sessions
- File: `src/routes/_protected/dashboard/index.tsx`

### 4. Favicon System Ready
- New source image downloaded
- Generation script created
- Run: `node scripts/generate-residencify-favicon.js`

---

## 🎨 Tech Stack (Quick)

- **Frontend**: React + TanStack Start
- **Backend**: Server Functions
- **Database**: Appwrite TablesDB
- **UI**: Shadcn/ui + Tailwind
- **Animations**: Motion

---

## 📊 Key Metrics Tracked

- Questions answered
- Categories completed
- Time spent practicing
- Session statistics
- OSCE scenarios viewed
- Quiz scores (for instructors)

---

## 🔒 Security Features

- Device fingerprinting (prevent account sharing)
- Max devices per plan
- Secure authentication
- Ownership-based access control

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `RESIDENCIFY_COMPLETE_GUIDE.md` | Full platform documentation |
| `LATEST_UPDATES.md` | Recent changes |
| `IMPLEMENTATION_SUMMARY.md` | Implementation details |
| `QUICK_START.md` | This file |

---

## 🚀 Getting Started (Developer)

1. **Clone & Install**
   ```bash
   git clone [repo]
   cd residencify
   bun install
   ```

2. **Environment Setup**
   - Appwrite credentials configured
   - Database and storage ready

3. **Run Development**
   ```bash
   bun run dev
   ```

4. **Generate Favicons** (when ready)
   ```bash
   node scripts/generate-residencify-favicon.js
   ```

---

## 🎯 User Journey (Example)

**New Student**:
1. Visits landing page
2. Fills registration form (name, email, specialty, PGY level)
3. Admin activates account with plan
4. Signs in → sees dashboard
5. Browses categories → starts practice
6. Answers questions → sees explanations
7. Bookmarks important questions
8. Connects with peers → shares questions
9. Tracks progress over time

---

## 💡 Quick Tips

- **Bookmarks**: Save questions you want to review later
- **Flagging**: Mark difficult questions during practice
- **Connections**: Connect with peers to share questions
- **Timer**: Optional timer for realistic exam practice
- **Resume**: Sessions auto-save, resume anytime
- **OSCE**: Don't forget to practice clinical scenarios too!

---

## 🆘 Common Tasks

### As Student
- **Start Practice**: Dashboard → Practice → Select Category
- **Bookmark Question**: Click bookmark icon during practice
- **Share Question**: Sharing Center → Select question → Choose peer
- **View Progress**: Dashboard shows all stats

### As Instructor
- **Create Quiz**: Admin → Quizzes → Create New
- **Add Students**: Quizzes → Manage Students → Add
- **View Results**: Quizzes → Attempts → Review

### As Admin
- **Add Questions**: Admin → Questions → Add New
- **Activate User**: Admin → Users → Edit → Set Active
- **Send Notification**: Admin → Notifications → Create

---

## 📞 Support

- **In-App**: Dashboard → Support → Submit Ticket
- **Feedback**: Report issues with specific questions
- **Status**: Beta - actively improving

---

## 🎓 Learning Philosophy

- **Active Recall**: MCQ format
- **Immediate Feedback**: Instant explanations
- **Spaced Repetition**: Resume and review
- **Progress Tracking**: Visual feedback
- **Collaborative**: Share with peers
- **Flexible**: Your own pace

---

## ✅ Current Status

- ✅ Registration enhanced (specialty + PGY level)
- ✅ Footer centralized
- ✅ Dashboard cleaned (3 cards)
- ✅ Favicon system ready
- ✅ Documentation complete
- ✅ Production ready

---

## 🎉 Summary

**Residencify** helps medical residents practice exams through:
- Comprehensive MCQ question banks
- OSCE clinical scenarios
- Progress tracking and analytics
- Peer collaboration features
- Instructor quiz tools
- Professional admin dashboard

**Goal**: Help residents excel in their training and exams! 🏥📚✨

---

*For detailed information, see `RESIDENCIFY_COMPLETE_GUIDE.md`*
