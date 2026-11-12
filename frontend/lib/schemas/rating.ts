import { z } from "zod"

export const RATING_VALUES = [1, 2, 3, 4, 5] as const

export type RatingValue = (typeof RATING_VALUES)[number]

export const ratingCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(4000).optional(),
})

export type RatingCreateInput = z.infer<typeof ratingCreateSchema>
