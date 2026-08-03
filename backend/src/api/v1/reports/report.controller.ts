import type { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import type { ReportService } from './report.service.js';
import { resolveDateRange } from './report.service.js';

export function createReportController(reports: ReportService) {
  return {
    salesSummary: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { from, to, groupBy } = matchedData(req, {
          locations: ['query'],
        }) as { from?: string; to?: string; groupBy?: 'day' | 'week' | 'month' };
        const range = resolveDateRange(from, to);
        const summary = await reports.salesSummary(
          req.shop!.shopId,
          range,
          groupBy ?? null,
        );
        res.json({ summary });
      } catch (e) {
        next(e);
      }
    },

    topProducts: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { from, to, limit } = matchedData(req, {
          locations: ['query'],
        }) as { from?: string; to?: string; limit?: number };
        const range = resolveDateRange(from, to);
        const result = await reports.topProducts(req.shop!.shopId, range, limit ?? 10);
        res.json(result);
      } catch (e) {
        next(e);
      }
    },

    preorderPipeline: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pipeline = await reports.preorderPipeline(req.shop!.shopId);
        res.json({ pipeline });
      } catch (e) {
        next(e);
      }
    },

    preorderShortages: async (req: Request, res: Response, next: NextFunction) => {
      try { res.json({ shortages: await reports.preorderShortages(req.shop!.shopId) }); }
      catch (e) { next(e); }
    },

    paymentMethods: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { from, to } = matchedData(req, { locations: ['query'] }) as {
          from?: string;
          to?: string;
        };
        const range = resolveDateRange(from, to);
        const breakdown = await reports.paymentMethods(req.shop!.shopId, range);
        res.json({ breakdown });
      } catch (e) {
        next(e);
      }
    },

    ordersExport: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { from, to } = matchedData(req, { locations: ['query'] }) as {
          from?: string;
          to?: string;
        };
        const range = resolveDateRange(from, to);
        const filename = `orders-${range.fromISO}-${range.toISO}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        for await (const chunk of reports.ordersExportCsv(req.shop!.shopId, range)) {
          if (res.destroyed) return;
          if (!res.write(chunk)) {
            await new Promise<void>((resolve) => {
              const done = () => {
                res.off('drain', done);
                res.off('close', done);
                resolve();
              };
              res.once('drain', done);
              res.once('close', done);
            });
          }
        }
        res.end();
      } catch (e) {
        next(e);
      }
    },

  };
}
