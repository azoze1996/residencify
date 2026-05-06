import {
  Client,
  TablesDB,
  ID,
  type Models,
  Permission,
  Role,
} from 'node-appwrite'
import type {
  Users,
  Plans,
  Questions,
  Categories,
  UserSessions,
  Feedback,
  SupportTickets,
  Notifications,
  UserNotifications,
  UserConnections,
  SharedQuestions,
  FlaggedQuestions,
  InstructorQuizzes,
  InstructorQuestions,
  InstructorStudents,
  QuizAttempts,
  InstructorCategories,
  PushNotifications,
  NotificationTemplates,
  GroupMembers,
  OsceTopics,
  OsceSpecialties,
  Bookmarks,
  OsceFeedback,
  UserCategoryProgress,
  InterestRegistrations,
  AiGenerationUsage,
  QuestionNotes,
} from './appwrite.types'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const tablesDB = new TablesDB(client)

export const db = {
  users: {
    create: (
      data: Omit<Users, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Users>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'users',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Users>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'users',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Users, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Users>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'users',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'users',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Users>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'users',
        queries,
      }),
  },
  plans: {
    create: (
      data: Omit<Plans, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Plans>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'plans',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Plans>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'plans',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Plans, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Plans>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'plans',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'plans',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Plans>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'plans',
        queries,
      }),
  },
  questions: {
    create: (
      data: Omit<Questions, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Questions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'questions',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Questions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'questions',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Questions, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Questions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'questions',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'questions',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Questions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'questions',
        queries,
      }),
  },
  categories: {
    create: (
      data: Omit<Categories, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Categories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'categories',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Categories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'categories',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Categories, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Categories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'categories',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'categories',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Categories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'categories',
        queries,
      }),
  },
  userSessions: {
    create: (
      data: Omit<UserSessions, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<UserSessions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_sessions',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<UserSessions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_sessions',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<UserSessions, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<UserSessions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_sessions',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_sessions',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<UserSessions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_sessions',
        queries,
      }),
  },
  feedback: {
    create: (
      data: Omit<Feedback, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Feedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'feedback',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Feedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'feedback',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Feedback, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Feedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'feedback',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'feedback',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Feedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'feedback',
        queries,
      }),
  },
  supportTickets: {
    create: (
      data: Omit<SupportTickets, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<SupportTickets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'support_tickets',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<SupportTickets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'support_tickets',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<SupportTickets, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<SupportTickets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'support_tickets',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'support_tickets',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<SupportTickets>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'support_tickets',
        queries,
      }),
  },
  notifications: {
    create: (
      data: Omit<Notifications, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Notifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notifications',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Notifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notifications',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Notifications, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Notifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notifications',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notifications',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Notifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notifications',
        queries,
      }),
  },
  userNotifications: {
    create: (
      data: Omit<UserNotifications, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<UserNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_notifications',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<UserNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_notifications',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<UserNotifications, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<UserNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_notifications',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_notifications',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<UserNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_notifications',
        queries,
      }),
  },
  userConnections: {
    create: (
      data: Omit<UserConnections, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<UserConnections>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_connections',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<UserConnections>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_connections',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<UserConnections, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<UserConnections>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_connections',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_connections',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<UserConnections>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_connections',
        queries,
      }),
  },
  sharedQuestions: {
    create: (
      data: Omit<SharedQuestions, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<SharedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'shared_questions',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<SharedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'shared_questions',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<SharedQuestions, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<SharedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'shared_questions',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'shared_questions',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<SharedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'shared_questions',
        queries,
      }),
  },
  flaggedQuestions: {
    create: (
      data: Omit<FlaggedQuestions, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<FlaggedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'flagged_questions',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<FlaggedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'flagged_questions',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<FlaggedQuestions, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<FlaggedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'flagged_questions',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'flagged_questions',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<FlaggedQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'flagged_questions',
        queries,
      }),
  },
  instructorQuizzes: {
    create: (
      data: Omit<InstructorQuizzes, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<InstructorQuizzes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_quizzes',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<InstructorQuizzes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_quizzes',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<InstructorQuizzes, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<InstructorQuizzes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_quizzes',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_quizzes',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<InstructorQuizzes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_quizzes',
        queries,
      }),
  },
  instructorQuestions: {
    create: (
      data: Omit<InstructorQuestions, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<InstructorQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_questions',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<InstructorQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_questions',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<InstructorQuestions, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<InstructorQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_questions',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_questions',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<InstructorQuestions>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_questions',
        queries,
      }),
  },
  instructorStudents: {
    create: (
      data: Omit<InstructorStudents, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<InstructorStudents>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_students',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<InstructorStudents>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_students',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<InstructorStudents, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<InstructorStudents>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_students',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_students',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<InstructorStudents>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_students',
        queries,
      }),
  },
  quizAttempts: {
    create: (
      data: Omit<QuizAttempts, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<QuizAttempts>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'quiz_attempts',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<QuizAttempts>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'quiz_attempts',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<QuizAttempts, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<QuizAttempts>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'quiz_attempts',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'quiz_attempts',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<QuizAttempts>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'quiz_attempts',
        queries,
      }),
  },
  instructorCategories: {
    create: (
      data: Omit<InstructorCategories, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<InstructorCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_categories',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<InstructorCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_categories',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<InstructorCategories, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<InstructorCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_categories',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_categories',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<InstructorCategories>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'instructor_categories',
        queries,
      }),
  },
  pushNotifications: {
    create: (
      data: Omit<PushNotifications, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<PushNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'push_notifications',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<PushNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'push_notifications',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<PushNotifications, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<PushNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'push_notifications',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'push_notifications',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<PushNotifications>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'push_notifications',
        queries,
      }),
  },
  notificationTemplates: {
    create: (
      data: Omit<NotificationTemplates, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<NotificationTemplates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notification_templates',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<NotificationTemplates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notification_templates',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<NotificationTemplates, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<NotificationTemplates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notification_templates',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notification_templates',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<NotificationTemplates>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'notification_templates',
        queries,
      }),
  },
  groupMembers: {
    create: (
      data: Omit<GroupMembers, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<GroupMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'group_members',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<GroupMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'group_members',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<GroupMembers, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<GroupMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'group_members',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'group_members',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<GroupMembers>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'group_members',
        queries,
      }),
  },
  osceTopics: {
    create: (
      data: Omit<OsceTopics, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<OsceTopics>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_topics',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<OsceTopics>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_topics',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<OsceTopics, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<OsceTopics>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_topics',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_topics',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<OsceTopics>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_topics',
        queries,
      }),
  },
  osceSpecialties: {
    create: (
      data: Omit<OsceSpecialties, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<OsceSpecialties>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_specialties',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<OsceSpecialties>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_specialties',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<OsceSpecialties, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<OsceSpecialties>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_specialties',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_specialties',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<OsceSpecialties>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_specialties',
        queries,
      }),
  },
  bookmarks: {
    create: (
      data: Omit<Bookmarks, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<Bookmarks>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'bookmarks',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<Bookmarks>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'bookmarks',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<Bookmarks, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<Bookmarks>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'bookmarks',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'bookmarks',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<Bookmarks>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'bookmarks',
        queries,
      }),
  },
  osceFeedback: {
    create: (
      data: Omit<OsceFeedback, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<OsceFeedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_feedback',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<OsceFeedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_feedback',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<OsceFeedback, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<OsceFeedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_feedback',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_feedback',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<OsceFeedback>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'osce_feedback',
        queries,
      }),
  },
  userCategoryProgress: {
    create: (
      data: Omit<UserCategoryProgress, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<UserCategoryProgress>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_category_progress',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<UserCategoryProgress>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_category_progress',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<UserCategoryProgress, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<UserCategoryProgress>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_category_progress',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_category_progress',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<UserCategoryProgress>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'user_category_progress',
        queries,
      }),
  },
  interestRegistrations: {
    create: (
      data: Omit<InterestRegistrations, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<InterestRegistrations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'interest_registrations',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<InterestRegistrations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'interest_registrations',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<InterestRegistrations, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<InterestRegistrations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'interest_registrations',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'interest_registrations',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<InterestRegistrations>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'interest_registrations',
        queries,
      }),
  },
  aiGenerationUsage: {
    create: (
      data: Omit<AiGenerationUsage, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<AiGenerationUsage>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'ai_generation_usage',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<AiGenerationUsage>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'ai_generation_usage',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<AiGenerationUsage, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<AiGenerationUsage>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'ai_generation_usage',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'ai_generation_usage',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<AiGenerationUsage>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'ai_generation_usage',
        queries,
      }),
  },
  questionNotes: {
    create: (
      data: Omit<QuestionNotes, keyof Models.Row>,
      options?: { rowId?: string; permissions?: string[] },
    ) =>
      tablesDB.createRow<QuestionNotes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'question_notes',
        rowId: options?.rowId ?? ID.unique(),
        data,
        permissions: [
          Permission.write(Role.user(data.createdBy)),
          Permission.read(Role.user(data.createdBy)),
          Permission.update(Role.user(data.createdBy)),
          Permission.delete(Role.user(data.createdBy)),
        ],
      }),
    get: (id: string) =>
      tablesDB.getRow<QuestionNotes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'question_notes',
        rowId: id,
      }),
    update: (
      id: string,
      data: Partial<Omit<QuestionNotes, keyof Models.Row>>,
      options?: { permissions?: string[] },
    ) =>
      tablesDB.updateRow<QuestionNotes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'question_notes',
        rowId: id,
        data,
        ...(options?.permissions ? { permissions: options.permissions } : {}),
      }),
    delete: (id: string) =>
      tablesDB.deleteRow({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'question_notes',
        rowId: id,
      }),
    list: (queries?: string[]) =>
      tablesDB.listRows<QuestionNotes>({
        databaseId: process.env.APPWRITE_DB_ID!,
        tableId: 'question_notes',
        queries,
      }),
  },
}
