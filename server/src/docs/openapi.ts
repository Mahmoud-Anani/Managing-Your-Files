import { env } from '../config/env';

const bearer = [{ bearerAuth: [] } as const];

const errorResponse = (
  description: string,
  exampleMessage: string,
  exampleError = 'ValidationError',
): {
  description: string;
  content: {
    'application/json': {
      schema: { $ref: string };
      example: { statusCode: number; message: string; error: string };
    };
  };
} => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        statusCode: exampleError === 'UnauthorizedError' ? 401 : 400,
        message: exampleMessage,
        error: exampleError,
      },
    },
  },
});

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Managing Your Files — API',
    version: '1.0.0',
    description: `REST API for the **Managing Your Files** platform.\n\nEvery protected endpoint requires a JWT access token obtained from \`POST /api/v1/auth/login\` (or by registering and verifying your email). Click **Authorize** and paste your token to enable authenticated requests.\n\n### Authentication flow\n1. Register an account (\`POST /api/v1/auth/register\`).\n2. Verify your email using the 6-digit code (\`POST /api/v1/auth/verify-email\`).\n3. Log in to receive a JWT (\`POST /api/v1/auth/login\`).`,
    contact: {
      name: 'Managing Your Files',
      email: env.GMAIL_USER || 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    { url: `http://localhost:${env.PORT}`, description: 'Local development server' },
  ],
  tags: [
    { name: 'Authentication', description: 'Register, verify, login and profile operations' },
    { name: 'Users', description: 'Administrative user management' },
    { name: 'Files', description: 'Upload, browse and manage your own files' },
    { name: 'Admin', description: 'Platform-wide file administration' },
    { name: 'Stats', description: 'Usage statistics for users and administrators' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT access token. Get one via `POST /api/v1/auth/login` — it is issued for 7 days.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['statusCode', 'message'],
        properties: {
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string', example: 'Invalid verification code' },
          error: {
            type: 'string',
            enum: [
              'ValidationError',
              'UnauthorizedError',
              'ConflictError',
              'NotFoundError',
            ],
            example: 'ValidationError',
          },
        },
      },
      Role: {
        type: 'string',
        enum: ['USER', 'ADMIN'],
        description: 'Account role. ADMIN grants access to administrative endpoints.',
      },
      SafeUser: {
        type: 'object',
        required: [
          'id',
          'name',
          'email',
          'role',
          'isVerified',
          'createdAt',
          'updatedAt',
        ],
        properties: {
          id: { type: 'string', format: 'uuid', example: '10ef975f-4688-4e57-ae0c-6ab07d459537' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          role: { $ref: '#/components/schemas/Role' },
          isVerified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: { type: 'string', description: 'JWT access token (Bearer).' },
          user: { $ref: '#/components/schemas/SafeUser' },
        },
      },
      RegisterResponse: {
        type: 'object',
        required: ['userId', 'email'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
        },
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: { message: { type: 'string', example: 'Email verified successfully' } },
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
          hasNextPage: { type: 'boolean', example: true },
          hasPreviousPage: { type: 'boolean', example: false },
        },
      },
      PaginatedUsers: {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/SafeUser' } },
          pagination: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      SafeFile: {
        type: 'object',
        required: [
          'id',
          'originalName',
          'storedName',
          'mimeType',
          'size',
          'extension',
          'url',
          'userId',
          'createdAt',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          originalName: { type: 'string', example: 'quarterly-report.pdf' },
          storedName: {
            type: 'string',
            description: 'Cloudinary public ID of the asset.',
            example: 'managing-your-files/25f7d1af-082a-476b-a59a-0c4085c0dc15.pdf',
          },
          mimeType: { type: 'string', example: 'application/pdf' },
          size: { type: 'integer', format: 'int64', example: 102400 },
          extension: { type: 'string', example: 'pdf' },
          url: { type: 'string', format: 'uri', description: 'Cloudinary CDN URL of the file.', example: 'https://res.cloudinary.com/<cloud_name>/image/upload/v1/managing-your-files/25f7d1af-082a-476b-a59a-0c4085c0dc15.pdf' },
          userId: { type: 'string', format: 'uuid', description: 'Owner of the file.' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      FileDetail: {
        allOf: [
          { $ref: '#/components/schemas/SafeFile' },
          {
            type: 'object',
            required: ['extractedText'],
            properties: {
              extractedText: {
                type: 'string',
                nullable: true,
                description:
                  'Text extracted from PDF / plain-text files (truncated to 100,000 chars). Null when not available.',
                example: 'Quarterly financial results…',
              },
            },
          },
        ],
      },
      PaginatedFiles: {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/SafeFile' } },
          pagination: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
      TypeStat: {
        type: 'object',
        required: ['extension', 'count', 'sizeBytes'],
        properties: {
          extension: { type: 'string', example: 'pdf' },
          count: { type: 'integer', example: 12 },
          sizeBytes: { type: 'integer', format: 'int64', example: 4096000 },
        },
      },
      DailyStat: {
        type: 'object',
        required: ['date', 'count'],
        properties: {
          date: { type: 'string', format: 'date', example: '2026-08-14' },
          count: { type: 'integer', example: 3 },
        },
      },
      UserStats: {
        type: 'object',
        required: ['totalFiles', 'totalStorageBytes', 'typeBreakdown', 'dailyUploads'],
        properties: {
          totalFiles: { type: 'integer', example: 21 },
          totalStorageBytes: { type: 'integer', format: 'int64', example: 52428800 },
          typeBreakdown: {
            type: 'array',
            description: 'Storage usage grouped by file extension, sorted by count (desc).',
            items: { $ref: '#/components/schemas/TypeStat' },
          },
          dailyUploads: {
            type: 'array',
            description: 'Uploads per day for the requested window; missing days are zero-filled.',
            items: { $ref: '#/components/schemas/DailyStat' },
          },
        },
      },
      AdminStats: {
        type: 'object',
        required: [
          'totalUsers',
          'totalFiles',
          'totalStorageBytes',
          'mostUploadedTypes',
          'recentUploads',
        ],
        properties: {
          totalUsers: { type: 'integer', example: 14 },
          totalFiles: { type: 'integer', example: 320 },
          totalStorageBytes: { type: 'integer', format: 'int64', example: 1073741824 },
          mostUploadedTypes: {
            type: 'array',
            items: { $ref: '#/components/schemas/TypeStat' },
          },
          recentUploads: {
            type: 'array',
            description: 'The 10 most recently uploaded files across the platform.',
            items: { $ref: '#/components/schemas/SafeFile' },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 72,
            description: 'At least 8 characters and must contain at least one number.',
            example: 'Password123',
          },
        },
      },
      VerifyEmailRequest: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          code: {
            type: 'string',
            pattern: '^\\d{6}$',
            description: 'The 6-digit code sent by email.',
            example: '483920',
          },
        },
      },
      ResendCodeRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          password: { type: 'string', format: 'password', example: 'Password123' },
        },
      },
      UpdateRoleRequest: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { $ref: '#/components/schemas/Role' },
        },
      },
    },
  },
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new account',
        description:
          'Creates an account and emails a 6-digit verification code. The account cannot log in until verified.',
        operationId: 'register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Account created; a verification code was sent by email.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterResponse' },
                example: {
                  userId: '10ef975f-4688-4e57-ae0c-6ab07d459537',
                  email: 'jane@example.com',
                },
              },
            },
          },
          '400': errorResponse('Invalid body (e.g. weak password or malformed email).', 'password: Password must contain at least one number'),
          '409': errorResponse('An account with this email already exists.', 'An account with this email already exists', 'ConflictError'),
        },
      },
    },
    '/api/v1/auth/verify-email': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify an email address',
        description:
          'Confirms ownership of an email using the 6-digit code from the email. Idempotent — already-verified emails succeed.',
        operationId: 'verifyEmail',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyEmailRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Email verified.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Email verified successfully' },
              },
            },
          },
          '400': errorResponse('Invalid code or code expired.', 'Invalid verification code'),
          '404': errorResponse('No account found for this email.', 'No account found for this email', 'NotFoundError'),
        },
      },
    },
    '/api/v1/auth/resend-code': {
      post: {
        tags: ['Authentication'],
        summary: 'Resend the verification code',
        description:
          'Issues a fresh 6-digit code and invalidates any previous ones. Subject to a 60-second cooldown per email.',
        operationId: 'resendCode',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResendCodeRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'A new code was sent.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Verification code sent' },
              },
            },
          },
          '400': errorResponse('Rate limited, email already verified, or invalid body.', 'Please wait 60 seconds before requesting another code'),
          '404': errorResponse('No account found for this email.', 'No account found for this email', 'NotFoundError'),
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in',
        description: 'Authenticates with email and password and returns a JWT access token.',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated. Use the token as `Authorization: Bearer <token>`.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
                example: {
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…',
                  user: {
                    id: '10ef975f-4688-4e57-ae0c-6ab07d459537',
                    name: 'Jane Doe',
                    email: 'jane@example.com',
                    role: 'USER',
                    isVerified: true,
                    createdAt: '2026-08-13T21:50:01.642Z',
                    updatedAt: '2026-08-13T21:50:01.642Z',
                  },
                },
              },
            },
          },
          '400': errorResponse('Account is not verified yet.', 'Please verify your email before logging in'),
          '401': errorResponse('Invalid email or password.', 'Invalid email or password', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current user',
        description: 'Returns the authenticated user’s profile.',
        operationId: 'getProfile',
        security: bearer,
        responses: {
          '200': {
            description: 'The authenticated user.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SafeUser' },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description:
          'Paginated list of all users. Supports free-text search on name/email, role filtering and sorting. **ADMIN only.**',
        operationId: 'listUsers',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 10000, default: 1 }, description: 'Page number (1-based).' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Items per page.' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string', maxLength: 100 }, description: 'Matches name or email (case-insensitive).' },
          { name: 'role', in: 'query', required: false, schema: { $ref: '#/components/schemas/Role' }, description: 'Filter by role.' },
          { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: ['createdAt', 'name', 'email'], default: 'createdAt' }, description: 'Sort field.' },
          { name: 'sortOrder', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction.' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of users.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedUsers' },
              },
            },
          },
          '400': errorResponse('Invalid query parameters.', 'limit: Expected number, received string'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update a user’s role',
        description: 'Changes the role of another user. You cannot change your own role. **ADMIN only.**',
        operationId: 'updateUserRole',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Target user id.' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRoleRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SafeUser' },
              },
            },
          },
          '400': errorResponse('Invalid id, invalid role, or self-role change.', 'You cannot change your own role'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'UnauthorizedError'),
          '404': errorResponse('User not found.', 'User not found', 'NotFoundError'),
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        description:
          'Permanently deletes a user, their files and verification codes (cascade). You cannot delete your own account. **ADMIN only.**',
        operationId: 'deleteUser',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Target user id.' },
        ],
        responses: {
          '200': {
            description: 'User deleted.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'User deleted successfully' },
              },
            },
          },
          '400': errorResponse('Invalid id or self-deletion.', 'You cannot delete your own account'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'UnauthorizedError'),
          '404': errorResponse('User not found.', 'User not found', 'NotFoundError'),
        },
      },
    },
    '/api/v1/files/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload files',
        description:
          `Uploads up to 10 files at once as \`multipart/form-data\` using the field name \`files\`.\n\nAllowed types: PNG, JPEG, GIF, WebP, BMP, PDF, TXT, Markdown, CSV, JSON, XML. Maximum file size is configurable via \`MAX_FILE_SIZE_MB\`. Text is extracted from PDF and plain-text files.`,
        operationId: 'uploadFiles',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['files'],
                properties: {
                  files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'One or more files. Up to 10 per request.',
                  },
                },
              },
              encoding: {
                files: {
                  style: 'form',
                  explode: true,
                  allowReserved: false,
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Files uploaded successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SafeFile' },
                },
              },
            },
          },
          '400': errorResponse('No files, disallowed type, or file too large.', 'File type application/x-msdownload is not allowed'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/files': {
      get: {
        tags: ['Files'],
        summary: 'List your files',
        description:
          'Paginated list of the authenticated user’s files. Supports search by name, filtering by extension and sorting.',
        operationId: 'listFiles',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 10000, default: 1 }, description: 'Page number (1-based).' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Items per page.' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string', maxLength: 100 }, description: 'Matches the original file name (case-insensitive).' },
          { name: 'type', in: 'query', required: false, schema: { type: 'string', maxLength: 20, pattern: '^[a-z0-9]+$' }, description: 'Filter by extension, e.g. `pdf`.' },
          { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: ['createdAt', 'name', 'size'], default: 'createdAt' }, description: 'Sort field.' },
          { name: 'sortOrder', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction.' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of the user’s files.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedFiles' },
              },
            },
          },
          '400': errorResponse('Invalid query parameters.', 'type: Type must be an extension like pdf or png'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/files/{id}': {
      get: {
        tags: ['Files'],
        summary: 'Get a file',
        description: 'Returns full file details, including any extracted text. Users can only access their own files.',
        operationId: 'getFile',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'File id.' },
        ],
        responses: {
          '200': {
            description: 'File details.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FileDetail' },
              },
            },
          },
          '400': errorResponse('Invalid file id.', 'File id is required'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('The file belongs to another user.', 'You do not have permission to access this file'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
      delete: {
        tags: ['Files'],
        summary: 'Delete a file',
        description: 'Deletes the file and its Cloudinary asset. Users can only delete their own files.',
        operationId: 'deleteFile',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'File id.' },
        ],
        responses: {
          '200': {
            description: 'File deleted.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'File deleted successfully' },
              },
            },
          },
          '400': errorResponse('Invalid file id.', 'File id is required'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('The file belongs to another user.', 'You do not have permission to access this file'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
    },
    '/api/v1/admin/files': {
      get: {
        tags: ['Admin'],
        summary: 'List all files',
        description:
          'Paginated list of every file on the platform. Optionally filter by owner. **ADMIN only.**',
        operationId: 'adminListFiles',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 10000, default: 1 }, description: 'Page number (1-based).' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Items per page.' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string', maxLength: 100 }, description: 'Matches the original file name (case-insensitive).' },
          { name: 'type', in: 'query', required: false, schema: { type: 'string', maxLength: 20, pattern: '^[a-z0-9]+$' }, description: 'Filter by extension, e.g. `pdf`.' },
          { name: 'userId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' }, description: 'Filter by owner.' },
          { name: 'sortBy', in: 'query', required: false, schema: { type: 'string', enum: ['createdAt', 'name', 'size'], default: 'createdAt' }, description: 'Sort field.' },
          { name: 'sortOrder', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }, description: 'Sort direction.' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of all files.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedFiles' },
              },
            },
          },
          '400': errorResponse('Invalid query parameters.', 'userId: Invalid user id'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/admin/files/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete any file',
        description: 'Deletes any file on the platform, regardless of owner. **ADMIN only.**',
        operationId: 'adminDeleteFile',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'File id.' },
        ],
        responses: {
          '200': {
            description: 'File deleted.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'File deleted successfully' },
              },
            },
          },
          '400': errorResponse('Invalid file id.', 'File id is required'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'UnauthorizedError'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
    },
    '/api/v1/stats/user': {
      get: {
        tags: ['Stats'],
        summary: 'Get your storage stats',
        description:
          'Storage usage for the authenticated user: total file count, total bytes, a breakdown by extension, and uploads per day for the requested window.',
        operationId: 'getUserStats',
        security: bearer,
        parameters: [
          { name: 'days', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 30, default: 7 }, description: 'Number of days of daily-upload history to include.' },
        ],
        responses: {
          '200': {
            description: 'User statistics.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserStats' },
                example: {
                  totalFiles: 21,
                  totalStorageBytes: 52428800,
                  typeBreakdown: [
                    { extension: 'pdf', count: 12, sizeBytes: 4096000 },
                    { extension: 'png', count: 9, sizeBytes: 1048576 },
                  ],
                  dailyUploads: [
                    { date: '2026-08-08', count: 0 },
                    { date: '2026-08-14', count: 3 },
                  ],
                },
              },
            },
          },
          '400': errorResponse('Invalid `days` value.', 'days: Number must be less than or equal to 30'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/stats/admin': {
      get: {
        tags: ['Stats'],
        summary: 'Get platform stats',
        description:
          'Platform-wide statistics: total users, total files, total storage, the most common file types and the 10 most recent uploads. **ADMIN only.**',
        operationId: 'getAdminStats',
        security: bearer,
        responses: {
          '200': {
            description: 'Platform statistics.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminStats' },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'UnauthorizedError'),
        },
      },
    },
  },
};
