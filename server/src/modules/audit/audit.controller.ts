import type { Request, Response } from 'express';
import { AuditService } from './audit.service';
import type { ListAuditLogsQueryDto } from './audit.dto';

const auditService = new AuditService();

export class AuditController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListAuditLogsQueryDto;
    const result = await auditService.list(query);
    res.json(result);
  }

  async actions(req: Request, res: Response): Promise<void> {
    const result = await auditService.distinctActions();
    res.json({ data: result });
  }
}
