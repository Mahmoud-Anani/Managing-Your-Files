import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { StatsService } from './stats.service';
import type { UserStatsQueryDto } from './stats.dto';

const statsService = new StatsService();

export class StatsController {
  async userStats(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const query = req.query as unknown as UserStatsQueryDto;
    const result = await statsService.userStats(user, query.days);
    res.json(result);
  }

  async adminStats(req: Request, res: Response): Promise<void> {
    const result = await statsService.adminStats();
    res.json(result);
  }
}
