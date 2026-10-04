import { z } from 'zod';

export const contractMetadata = {
  endpoint: '/api/v1/nutrition',
  version: '1.0.0',
  description: 'Nutrition profile, food search, meal logging, and meal plan contracts for /api/v1/nutrition/**',
};

export const DIETARY_PATTERNS = [
  'none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'halal', 'kosher',
];

export const NUTRITION_GOALS = ['lose_weight', 'maintain', 'gain_muscle', 'improve_health'];

export const nutritionProfileSchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  user: z.any(),
  dietaryPattern: z.string().default('none'),
  goal: z.string().default('maintain'),
  allergies: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  pantry: z.array(z.string()).default([]),
  calorieTarget: z.number().nullable().optional(),
  proteinTarget: z.number().nullable().optional(),
  carbsTarget: z.number().nullable().optional(),
  fatTarget: z.number().nullable().optional(),
  mealsPerDay: z.number().int().optional().default(3),
  cookingSkill: z.string().optional().default('intermediate'),
  maxPrepTimeMinutes: z.number().int().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const nutritionProfileResponseSchema = z.object({
  profile: nutritionProfileSchema.nullable(),
}).passthrough();

export const nutritionProfileUpdateRequestSchema = z.object({
  dietaryPattern: z.enum(['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'halal', 'kosher']).optional(),
  goal: z.enum(['lose_weight', 'maintain', 'gain_muscle', 'improve_health']).optional(),
  allergies: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  pantry: z.array(z.string()).optional(),
  calorieTarget: z.number().min(0).max(10000).nullable().optional(),
  proteinTarget: z.number().min(0).max(10000).nullable().optional(),
  carbsTarget: z.number().min(0).max(10000).nullable().optional(),
  fatTarget: z.number().min(0).max(10000).nullable().optional(),
  mealsPerDay: z.number().min(1).max(8).optional(),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  maxPrepTimeMinutes: z.number().min(5).max(180).nullable().optional(),
}).strict();

export const foodItemSchema = z.object({
  _id: z.any().optional(),
  name: z.string(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  servingSize: z.number().optional(),
  servingUnit: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  imageSource: z.string().optional(),
  imageAttribution: z.string().optional(),
}).passthrough();

export const foodSearchResponseSchema = z.object({
  foods: z.array(foodItemSchema),
}).passthrough();

export const mealLogItemSchema = z.object({
  _id: z.any(),
  id: z.string().optional(),
  user: z.any(),
  food: z.any().optional(),
  rawFood: z.any().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.number(),
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  date: z.union([z.string(), z.date()]),
  createdAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const mealLogListResponseSchema = z.object({
  logs: z.array(mealLogItemSchema),
  totals: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }).passthrough(),
}).passthrough();

export const mealLogCreateRequestSchema = z.object({
  foodId: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  servings: z.coerce.number().positive().max(50).default(1),
  date: z.union([z.string(), z.date()]).optional(),
  rawFood: z.object({
    name: z.string(),
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    servingSize: z.number().optional(),
    servingUnit: z.string().optional(),
  }).optional(),
}).strict();

export const mealPlanSchema = z.object({
  _id: z.any().optional(),
  id: z.string().optional(),
  user: z.any(),
  active: z.boolean().default(true),
  days: z.array(z.any()),
  weeklyGroceryList: z.array(z.string()).optional(),
  advisory: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
}).passthrough();

export const mealPlanResponseSchema = z.object({
  plan: mealPlanSchema.nullable().optional(),
  advisory: z.string().optional(),
}).passthrough();
