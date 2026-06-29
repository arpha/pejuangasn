import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, { message: 'Nama lengkap minimal 2 karakter' }),
    email: z.string().email({ message: 'Format email tidak valid' }),
    whatsapp: z
      .string()
      .min(10, { message: 'Nomor WhatsApp minimal 10 digit' })
      .max(15, { message: 'Nomor WhatsApp maksimal 15 digit' })
      .regex(/^[0-9+]+$/, { message: 'Nomor WhatsApp hanya boleh berisi angka dan tanda +' }),
    password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
