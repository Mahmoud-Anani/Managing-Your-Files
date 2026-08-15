import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi';

export const swaggerRouter = Router();

swaggerRouter.get('/docs.json', (_req, res) => {
  res.json(openapi);
});

swaggerRouter.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: 'Managing Your Files — API Docs',
    customfavIcon:
      'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%230e7c56%22/><text x=%2250%22 y=%2268%22 font-size=%2255%22 font-family=%22Arial%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22white%22>F</text></svg>',
    customCss: `
      .topbar { display: none; }
      .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      .swagger-ui .info .title { color: #111827; }
      .swagger-ui .btn.authorize { background-color: #0e7c56; border-color: #0e7c56; color: #fff; }
      .swagger-ui .btn.authorize svg { fill: #fff; }
      .swagger-ui .opblock-tag { font-size: 16px; }
      .swagger-ui .info .title small { background: #0e7c56; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      syntaxHighlight: { theme: 'tomorrow-night' },
    },
  }),
);
