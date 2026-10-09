import * as svc from '../services/onboarding.service.js';

export const nutritionists = async (_req, res) => res.json(await svc.listNutritionists());
export const complete = async (req, res) => res.status(201).json(await svc.completeOnboarding(req.body));
