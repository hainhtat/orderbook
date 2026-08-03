import type { NextFunction, Request, Response } from 'express';
import { matchedData } from 'express-validator';
import type { AiService } from './ai.service.js';
export function createAiController(ai: AiService) { return {
  config: async (req: Request, res: Response, next: NextFunction) => { try { res.json({ config: await ai.config(req.shop!.shopId) }); } catch (e) { next(e); } },
  saveConfig: async (req: Request, res: Response, next: NextFunction) => { try { const input = matchedData(req, { locations: ['body'] }) as { provider: string; apiKey?: string; model?: string; isEnabled: boolean }; res.json({ config: await ai.saveConfig(req.shop!.shopId, input) }); } catch (e) { next(e); } },
  createSession: async (req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ session: await ai.createSession(req.shop!.shopId, req.user!.userId) }); } catch (e) { next(e); } },
  message: async (req: Request, res: Response, next: NextFunction) => { try { const { id, content } = matchedData(req) as { id: string; content: string }; res.json({ draft: await ai.message(req.shop!.shopId, req.user!.userId, id, content) }); } catch (e) { next(e); } },
}; }
