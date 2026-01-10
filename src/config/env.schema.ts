import { z } from 'zod';

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    APP_NAME: z.string().min(1).default('fundamentals-api'),
    JWT_SECRET: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET is required when NODE_ENV=production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
