import { z } from 'zod';

// User authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Goal schemas
export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  targetDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high']),
});

export const progressUpdateSchema = z.object({
  goalId: z.string().uuid('Invalid goal ID'),
  progress: z.number().min(0).max(100),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

// Chat/Message schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  chatId: z.string().uuid('Invalid chat ID'),
  type: z.enum(['text', 'image', 'file']).default('text'),
});

// Profile schemas
export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
});

// Settings schemas
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  goalReminders: z.boolean(),
  chatNotifications: z.boolean(),
});

export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']),
  showProgress: z.boolean(),
  allowMessages: z.enum(['everyone', 'friends', 'nobody']),
});

// API response schemas
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    success: z.boolean().default(true),
  });

export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

// Environment variable validation
export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  VITE_SUPABASE_REDIRECT_URL: z.string().url('Invalid redirect URL').optional(),
  VITE_APP_NAME: z.string().optional(),
  VITE_APP_DESCRIPTION: z.string().optional(),
});

// Type exports
export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type GoalForm = z.infer<typeof goalSchema>;
export type ProgressUpdate = z.infer<typeof progressUpdateSchema>;
export type MessageForm = z.infer<typeof messageSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type PrivacySettings = z.infer<typeof privacySettingsSchema>;
export type EnvVars = z.infer<typeof envSchema>;