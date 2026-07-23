import { z } from 'zod';

export const profileSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder los 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
  full_name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder los 50 caracteres'),
  avatar_url: z.string().url('URL de avatar inválida').optional().nullable(),
  cover_url: z.string().url('URL de portada inválida').optional().nullable(),
  is_private: z.boolean().default(false),
});

export const mediaUploadSchema = z.object({
  caption: z.string().max(500, 'El pie de foto no puede exceder los 500 caracteres').optional(),
  type: z.enum(['image', 'video']),
  url: z.string().url('URL de medio inválida'),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(2000, 'El mensaje es demasiado largo'),
  receiver_id: z.string().uuid('ID de receptor inválido'),
});
