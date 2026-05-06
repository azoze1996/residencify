# 🏥 Residencify - Complete Workflow & Features Guide

## 📋 Overview

**Residencify** is a comprehensive web application designed for medical residents to practice MCQ exams and OSCE scenarios. The platform provides a structured learning environment with progress tracking, bookmarking, and collaborative features.

---

## 🎯 Core Purpose

Residencify serves as an educational platform for trainee residents to:
- Practice medical MCQ questions organized by specialty and topic
- Review OSCE (Objective Structured Clinical Examination) scenarios
- Track learning progress and performance
- Collaborate with peers through question sharing
- Prepare systematically for residency exams

---

## 👥 User Roles & Access Levels

### 1. **Students (Regular Users)**
- Access to MCQ question banks based on their subscription plan
- Practice questions by category and pool
- Track progress and performance
- Bookmark questions and OSCE scenarios
- Share questions with connected peers
- Submit feedback and support tickets

### 2. **Instructors**
- All student features PLUS:
- Create custom quizzes for their students
- Manage student groups (up to maxStudents limit)
- Track student performance and quiz results
- Create custom categories and questions
- Publish and manage quiz results

### 3. **Administrators**
- Full system access
- Manage users, plans, and subscriptions
- Manage question banks and categories
- Manage OSCE topics and specialties
- Review and respond to feedback and support tickets
- Send push notifications to users
- View system analytics and usage statistics

---

## 🔐 Authentication & Registration

### Sign Up Process
1. User registers with email and password
2. Creates a unique username
3. System generates device fingerprint for device tracking
4. Account created with default "inactive" status
5. Admin activates account and assigns plan

### Sign In Process
1. Email and password authentication
2. Device fingerprint verification (max devices per plan)
3. Session creation with secure cookies
4. Redirect to dashboard

### Device Management
- Each user has a maximum number of allowed devices (based on plan)
- Device fingerprinting prevents account sharing
- Users can see their last used device
- Admins can reset device access if needed

---

## 📚 Main Features & Workflows

### 1. **MCQ Practice System**

#### Category Selection
- Users see categories based on their domain (e.g., "Saudi", "International")
- Categories are organized hierarchically (parent/child structure)
- Each category contains multiple question pools
- Visual progress indicators show completion status

#### Practice Session Flow
1. **Start Session**
   - Select a category
   - Choose timer option (optional)
   - System loads questions from assigned pools
   - Session is created and tracked

2. **During Practice**
   - Questions displayed one at a time
   - Four multiple-choice options (A, B, C, D)
   - Optional image support for questions
   - Timer countdown (if enabled)
   - Flag questions for later review
   - Submit answer and see immediate feedback
   - View explanation for correct answer
   - Navigate between questions

3. **Session Management**
   - Sessions auto-save progress
   - Resume from last question on return
   - Track answered questions
   - Calculate elapsed time
   - Mark session as completed when finished

4. **Progress Tracking**
   - Total questions answered
   - Categories completed
   - Time spent practicing
   - Session statistics (total, completed, in-progress)
   - Overall progress percentage

### 2. **OSCE Scenarios**

#### OSCE Practice Flow
1. **Browse Specialties**
   - View available OSCE specialties
   - See topic count per specialty
   - Filter by specialty

2. **View Scenarios**
   - Read clinical scenario
   - View scenario image (if available)
   - Review interaction guidelines
   - Study approach and management

3. **Bookmark & Track**
   - Bookmark scenarios for later review
   - Track viewed scenarios
   - Calculate OSCE progress percentage
   - Submit feedback on scenarios

### 3. **Bookmarks System**

Users can bookmark:
- **MCQ Questions**: Save specific questions for review
- **OSCE Scenarios**: Save clinical scenarios

#### Bookmark Features
- View all bookmarks in one place
- Filter by type (MCQ vs OSCE)
- Quick access to bookmarked content
- Remove bookmarks when no longer needed
- Bookmark metadata (question number, pool, specialty)

### 4. **Question Sharing & Collaboration**

#### User Connections
1. **Send Connection Request**
   - Search for users by username
   - Send connection request
   - Pending status until accepted

2. **Manage Connections**
   - Accept/reject incoming requests
   - View connected users
   - Remove connections

#### Question Sharing
1. **Share Questions**
   - Select questions from practice sessions
   - Choose connected users to share with
   - Set permission level (view/edit)
   - Questions appear in recipient's shared collection

2. **View Shared Questions**
   - Access questions shared by connections
   - See who shared each question
   - Practice shared questions
   - Track shared question metadata

### 5. **Flagged Questions**

- Flag questions during practice for later review
- Add optional notes to flagged questions
- View all flagged questions in one place
- Track question number and pool
- Remove flags after review

### 6. **Feedback System**

#### Question Feedback
- Report issues with specific questions
- Suggest corrections or improvements
- Track feedback status (pending/reviewed/resolved)
- Receive admin responses
- View feedback history

#### OSCE Feedback
- Submit feedback on OSCE scenarios
- Report errors or suggest improvements
- Track feedback status
- Receive admin responses

### 7. **Support Tickets**

- Submit support requests
- Categorize by priority (low/medium/high)
- Track ticket status (open/in-progress/resolved)
- Receive admin responses
- View ticket history
- Auto-reply system for common issues

### 8. **Notifications**

#### In-App Notifications
- System announcements
- Plan expiration reminders
- Quiz invitations (for students)
- Feedback responses
- Support ticket updates
- Connection requests

#### Push Notifications (Admin)
- Broadcast to all users
- Target specific categories (students/instructors)
- Target specific users
- Schedule notifications
- Track delivery and read status
- Use templates for common messages

### 9. **Instructor Features**

#### Quiz Management
1. **Create Quiz**
   - Set title and description
   - Choose category (optional)
   - Set timer duration
   - Set passing score
   - Configure retake options
   - Add questions with explanations

2. **Manage Students**
   - Add students to group (up to maxStudents)
   - View student list
   - Remove students
   - Track student status

3. **Quiz Attempts**
   - View all student attempts
   - See scores and completion status
   - Review individual answers
   - Track time taken
   - Publish/unpublish results

4. **Custom Categories**
   - Create instructor-specific categories
   - Organize custom content
   - Assign to quizzes

### 10. **Admin Dashboard**

#### User Management
- View all users
- Edit user details
- Activate/deactivate accounts
- Assign plans
- Set access levels
- Manage device limits
- Reset device access
- Promote to instructor/admin

#### Plan Management
- Create subscription plans
- Set duration and pricing (SAR/USD)
- Define access categories
- Set question pool access
- Configure max questions
- Set device limits
- Activate/deactivate plans

#### Question Bank Management
- Add/edit/delete questions
- Upload question images
- Assign to pools
- Set correct answers
- Add explanations
- Bulk import questions
- Manage question metadata

#### Category Management
- Create/edit categories
- Set domain (Saudi/International)
- Assign pool numbers
- Set parent/child relationships
- Order categories
- Activate/deactivate

#### OSCE Management
- Create specialties
- Add OSCE topics
- Upload scenario images
- Define interactions
- Order topics
- Activate/deactivate

#### Feedback & Support
- Review question feedback
- Review OSCE feedback
- Respond to support tickets
- Set ticket priority
- Update ticket status
- Send responses

#### Notifications
- Create push notifications
- Use templates
- Target specific users/groups
- Schedule delivery
- Track delivery status

---

## 📊 Progress Tracking System

### User Progress Metrics
1. **MCQ Progress**
   - Total questions answered
   - Questions per category
   - Completion percentage
   - Time spent practicing

2. **OSCE Progress**
   - Scenarios viewed
   - Specialties covered
   - Completion percentage

3. **Category Completion**
   - Track completed categories
   - Mark categories as done
   - View completion history

4. **Session Statistics**
   - Total sessions created
   - Completed sessions
   - In-progress sessions
   - Average time per session

---

## 🎨 User Interface Features

### Landing Page
- Hero section with value proposition
- Feature highlights
- Category showcase
- Call-to-action for registration
- Interest registration form (collects: name, email, specialty, PGY level)

### Dashboard
- Welcome message with user name
- Quick stats overview (questions, topics, sessions, plan status)
- Progress cards (MCQ & OSCE)
- Quick action buttons
- Recent sessions list
- Resume session functionality

### Practice Interface
- Clean question display
- Option selection
- Timer (if enabled)
- Flag button
- Submit button
- Explanation view
- Navigation controls
- Progress indicator

### Responsive Design
- Mobile-optimized
- Touch-friendly controls
- Adaptive layouts
- Dark mode support

---

## 🔒 Security & Privacy

### Authentication
- Secure password hashing
- Session-based authentication
- HTTP-only cookies
- Device fingerprinting

### Data Protection
- User data isolation
- Ownership-based access control
- Secure file storage
- API key protection

### Device Management
- Device limit enforcement
- Fingerprint tracking
- Device reset capability

---

## 📱 Technical Architecture

### Frontend
- **Framework**: React with TanStack Start
- **Routing**: TanStack Router
- **State Management**: TanStack Query
- **UI Components**: Shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **Animations**: Motion (Framer Motion)
- **Forms**: React Hook Form with Zod validation

### Backend
- **Server Functions**: TanStack Start server functions
- **Database**: Appwrite TablesDB
- **Storage**: Appwrite Storage (for images)
- **Authentication**: Appwrite Auth
- **File Handling**: Sharp for image processing

### Database Schema
- **Users**: User profiles and authentication
- **Plans**: Subscription plans and pricing
- **Questions**: MCQ question bank
- **Categories**: Question organization
- **UserSessions**: Practice session tracking
- **Feedback**: Question and OSCE feedback
- **SupportTickets**: User support requests
- **Notifications**: System notifications
- **UserNotifications**: User-specific notifications
- **UserConnections**: Peer connections
- **SharedQuestions**: Question sharing
- **FlaggedQuestions**: Flagged questions for review
- **InstructorQuizzes**: Custom quizzes
- **InstructorQuestions**: Quiz questions
- **InstructorStudents**: Student groups
- **QuizAttempts**: Quiz attempt tracking
- **InstructorCategories**: Custom categories
- **PushNotifications**: Push notification system
- **NotificationTemplates**: Notification templates
- **GroupMembers**: Instructor group members
- **OsceTopics**: OSCE scenarios
- **OsceSpecialties**: OSCE specialties
- **Bookmarks**: User bookmarks
- **OsceFeedback**: OSCE feedback
- **UserCategoryProgress**: Category completion tracking
- **InterestRegistrations**: Pre-launch interest list
- **AiGenerationUsage**: AI usage tracking (future feature)

---

## 🚀 User Journey Examples

### Example 1: New Student User
1. Registers interest on landing page (provides name, email, specialty, PGY level)
2. Admin reviews and creates account with appropriate plan
3. User signs in and sees dashboard
4. Browses available categories
5. Starts practice session in chosen category
6. Answers questions, flags difficult ones
7. Reviews explanations
8. Bookmarks important questions
9. Completes session
10. Views progress on dashboard
11. Connects with peers
12. Shares useful questions

### Example 2: Instructor User
1. Signs in with instructor account
2. Creates new quiz for students
3. Adds questions with explanations
4. Invites students to group
5. Publishes quiz
6. Students take quiz
7. Reviews student attempts
8. Provides feedback
9. Publishes results
10. Tracks student progress

### Example 3: Admin User
1. Signs in to admin dashboard
2. Reviews new interest registrations
3. Creates user accounts and assigns plans
4. Uploads new questions to question bank
5. Creates new OSCE scenarios
6. Reviews user feedback
7. Responds to support tickets
8. Sends push notification about new content
9. Views system analytics

---

## 📈 Future Enhancements

Based on the database schema, planned features include:
- AI-powered question generation (AiGenerationUsage table exists)
- Advanced analytics and reporting
- Gamification elements
- Leaderboards and competitions
- Video explanations for questions
- Live quiz sessions
- Mobile app (PWA ready)

---

## 🎓 Educational Philosophy

Residencify is designed around evidence-based learning principles:
- **Spaced Repetition**: Resume sessions and review flagged questions
- **Active Recall**: MCQ format promotes active learning
- **Immediate Feedback**: Instant explanations after answers
- **Progress Tracking**: Visual feedback on learning progress
- **Collaborative Learning**: Share and discuss questions with peers
- **Realistic Practice**: OSCE scenarios mirror real clinical situations
- **Flexible Learning**: Practice at your own pace with optional timers

---

## 📞 Support & Resources

- **In-App Support**: Submit tickets directly from dashboard
- **Feedback System**: Report issues with specific questions
- **Notifications**: Stay updated on new content and features
- **Beta Status**: Platform is actively being improved based on user feedback

---

## 🏆 Key Differentiators

1. **Comprehensive Coverage**: MCQ + OSCE in one platform
2. **Collaborative Features**: Share questions and connect with peers
3. **Instructor Tools**: Create custom quizzes and manage student groups
4. **Progress Tracking**: Detailed analytics on learning progress
5. **Device Management**: Secure access control
6. **Responsive Design**: Works on all devices
7. **Educational Focus**: Built specifically for medical residents
8. **Flexible Plans**: Multiple subscription tiers for different needs

---

## 📝 Summary

Residencify is a complete learning management system tailored for medical residents preparing for exams. It combines question practice, clinical scenarios, progress tracking, collaboration tools, and instructor features into a unified platform. The system is designed to support individual learning, peer collaboration, and instructor-led education, all while maintaining security and tracking detailed progress metrics.

The platform serves three main user types (students, instructors, admins) with role-specific features, and provides a comprehensive workflow from registration through practice, collaboration, and assessment. With its focus on medical education, device security, and progress tracking, Residencify aims to be the go-to platform for residency exam preparation.
