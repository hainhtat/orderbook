import type { NextFunction, Request, Response } from 'express';
import { matchedData } from 'express-validator';
import type { CashbookService } from './cashbook.service.js';

export function createCashbookController(cashbook: CashbookService) {
  return {
    accounts: async (req: Request, res: Response, next: NextFunction) => { try { res.json({ accounts: await cashbook.accounts(req.shop!.shopId) }); } catch (error) { next(error); } },
    createAccount: async (req: Request, res: Response, next: NextFunction) => { try { const account = await cashbook.createAccount(req.shop!.shopId, matchedData(req) as Parameters<CashbookService['createAccount']>[1]); res.status(201).json({ account }); } catch (error) { next(error); } },
    entries: async (req: Request, res: Response, next: NextFunction) => { try { const result = await cashbook.entries(req.shop!.shopId, matchedData(req) as Parameters<CashbookService['entries']>[1]); res.json({ entries: result.items, pagination: result.pagination }); } catch (error) { next(error); } },
    summary: async (req: Request, res: Response, next: NextFunction) => { try { res.json({ summary: await cashbook.summary(req.shop!.shopId, matchedData(req) as Parameters<CashbookService['summary']>[1]) }); } catch (error) { next(error); } },
    dailyReport: async (req: Request, res: Response, next: NextFunction) => { try { const { date } = matchedData(req) as { date: string }; res.json({ report: await cashbook.dailyReport(req.shop!.shopId, date) }); } catch (error) { next(error); } },
    createEntry: async (req: Request, res: Response, next: NextFunction) => { try { const entry = await cashbook.createEntry(req.shop!.shopId, req.user!.userId, matchedData(req) as Parameters<CashbookService['createEntry']>[2]); res.status(201).json({ entry }); } catch (error) { next(error); } },
    transfer: async (req: Request, res: Response, next: NextFunction) => { try { const result = await cashbook.transfer(req.shop!.shopId, req.user!.userId, matchedData(req) as Parameters<CashbookService['transfer']>[2]); res.status(201).json(result); } catch (error) { next(error); } },
    reverse: async (req: Request, res: Response, next: NextFunction) => { try { const { id, note } = matchedData(req) as { id: string; note: string }; const entry = await cashbook.reverse(req.shop!.shopId, req.user!.userId, id, note); res.status(201).json({ entry }); } catch (error) { next(error); } },
  };
}
