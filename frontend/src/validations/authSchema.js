import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
name: z
  .string()
  .trim()
  .min(2, { message: 'Name must be at least 2 characters long' })
  .max(50, { message: 'Name cannot exceed 50 characters' })
  .regex(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain alphabetic letters, spaces, hyphens, and apostrophes (no numbers or symbols)',
  }),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['tenant', 'landlord'], {
    required_error: 'Please select an account type',
  }),
});