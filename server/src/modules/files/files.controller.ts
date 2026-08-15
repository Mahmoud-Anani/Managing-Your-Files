import type { Request, Response } from 'express';
import { getAuthUser } from '../../common/guards';
import { ValidationError } from '../../common/errors';
import { FilesService } from './files.service';
import type { AuditContext } from '../audit/audit.service';
import type { AdminListFilesQueryDto, ListFilesQueryDto } from './files.dto';

const filesService = new FilesService();

function auditContextFrom(req: Request): AuditContext {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

function contentDisposition(filename: string, inline: boolean): string {
  const disposition = inline ? 'inline' : 'attachment';
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}; filename="${filename.replace(/["\\]/g, '')}"`;
}

async function streamCloudinary(
  req: Request,
  res: Response,
  id: string,
  inline: boolean,
): Promise<void> {
  const user = getAuthUser(req);
  const file = inline
    ? await filesService.getForPreview(user, id, auditContextFrom(req))
    : await filesService.getForDownload(user, id, auditContextFrom(req));

  // Try to proxy the asset through the server with a short timeout. If the
  // upstream fetch fails (network issues, timeouts, DNS), fall back to
  // redirecting the client directly to the Cloudinary URL so they can still
  // preview / download the file.
  const controller = new AbortController();
  const FETCH_TIMEOUT_MS = 10000; // 10s
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Awaited<ReturnType<typeof fetch>> | undefined;
  try {
    // Use the global fetch (undici) available in Node.
    upstream = await fetch(file.url, { signal: controller.signal });
  } catch {
    clearTimeout(timeout);
    // Network error / timeout — fall back to redirect so the user still gets the file
    res.setHeader('Cache-Control', 'private, no-store');
    return res.redirect(file.url);
  }
  clearTimeout(timeout);

  if (!upstream.ok || !upstream.body) {
    // Upstream returned an error — redirect as a graceful fallback.
    res.setHeader('Cache-Control', 'private, no-store');
    return res.redirect(file.url);
  }

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader(
    'Content-Disposition',
    contentDisposition(file.originalName, inline),
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200);

  const reader = upstream.body.getReader();

  const pump = (): Promise<void> =>
    reader.read().then(({ done, value }) => {
      if (done) {
        res.end();
        return;
      }
      res.write(Buffer.from(value));
      return pump();
    });

  res.on('close', () => {
    void reader.cancel();
  });

  await pump();
}

export class FilesController {
  async upload(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      throw new ValidationError('At least one file is required');
    }
    const result = await filesService.upload(
      user,
      files,
      auditContextFrom(req),
    );
    res.status(201).json(result);
  }

  async list(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const query = req.query as unknown as ListFilesQueryDto;
    const result = await filesService.listOwn(user, query);
    res.json(result);
  }

  async trash(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const query = req.query as unknown as ListFilesQueryDto;
    const result = await filesService.listTrash(user, query);
    res.json(result);
  }

  async detail(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.getById(user, id);
    res.json(result);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.delete(user, id, auditContextFrom(req));
    res.json(result);
  }

  async restore(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.restore(user, id, auditContextFrom(req));
    res.json(result);
  }

  async purge(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.purge(user, id, auditContextFrom(req));
    res.json(result);
  }

  async download(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    await streamCloudinary(req, res, id, false);
  }

  async preview(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    await streamCloudinary(req, res, id, true);
  }

  async adminList(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as AdminListFilesQueryDto;
    const result = await filesService.adminList(query);
    res.json(result);
  }

  async adminTrash(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as AdminListFilesQueryDto;
    const result = await filesService.adminListTrash(query);
    res.json(result);
  }

  async adminRemove(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.adminDelete(
      actor,
      id,
      auditContextFrom(req),
    );
    res.json(result);
  }

  async adminRestore(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.adminRestore(
      actor,
      id,
      auditContextFrom(req),
    );
    res.json(result);
  }

  async adminPurge(req: Request, res: Response): Promise<void> {
    const actor = getAuthUser(req);
    const id = req.params.id;
    if (!id) {
      throw new ValidationError('File id is required');
    }
    const result = await filesService.adminPurge(
      actor,
      id,
      auditContextFrom(req),
    );
    res.json(result);
  }
}
