import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const difficulty = z.enum(['easy', 'medium', 'hard', 'insane']);

const baseSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  translationKey: z.string().optional(),
});

const writeups = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writeups' }),
  schema: ({ image }) =>
    baseSchema.extend({
      ctf: z.string().optional(),
      category: z.string().default('forensics'),
      difficulty: difficulty.optional(),
      points: z.number().optional(),
      cover: image().optional(),
    }),
});

const research = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/research' }),
  schema: ({ image }) =>
    baseSchema.extend({
      venue: z.string().optional(),
      externalUrl: z.string().url().optional(),
      pdfUrl: z.string().optional(),
      cover: image().optional(),
    }),
});

const challenges = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/challenges' }),
  schema: ({ image }) =>
    baseSchema.extend({
      category: z.string().default('forensics'),
      difficulty: difficulty.optional(),
      event: z.string().optional(),
      flagFormat: z.string().optional(),
      downloadUrl: z.string().optional(),
      sourceUrl: z.string().url().optional(),
      solved: z.number().optional(),
      cover: image().optional(),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: ({ image }) =>
    baseSchema.extend({
      category: z.string().optional(),
      cover: image().optional(),
    }),
});

export const collections = { writeups, research, challenges, notes };
