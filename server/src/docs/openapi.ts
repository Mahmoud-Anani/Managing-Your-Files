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
        statusCode:
          exampleError === 'UnauthorizedError' || exampleError === 'ForbiddenError'
            ? exampleError === 'ForbiddenError'
              ? 403
              : 401
            : 400,
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
    version: '2.0.0',
    description: [
      'REST API for the **Managing Your Files** platform.',
      '',
      '### Authentication',
      'This API uses **HttpOnly cookies** for authentication. After logging in via `POST /api/v1/auth/login`, the server sets `access_token` and `refresh_token` cookies automatically. No manual token handling is needed from the client — requests include cookies via `withCredentials`.',
      '',
      '**Flow:**',
      '1. Register (`POST /api/v1/auth/register`).',
      '2. Verify your email with the 6-digit code (`POST /api/v1/auth/verify-email`).',
      '3. Log in (`POST /api/v1/auth/login`) — cookies are set automatically.',
      '4. The access token expires in 15 minutes; use `POST /api/v1/auth/refresh` to renew it.',
      '',
      '### File Sharing',
      'Files can be shared with other users. Each share has a permission level:',
      '- **VIEW** — the recipient can open, preview, and download the file.',
      '- **EDIT** — the recipient can also delete the file.',
      '',
      '### Rate Limits',
      '- `POST /api/v1/auth/resend-code` — 1 request per 60 seconds per email.',
      '- `POST /api/v1/auth/forgot-password` — 1 request per 60 seconds per email.',
    ].join('\n'),
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
    { name: 'Authentication', description: 'Register, verify, login, profile and settings' },
    { name: 'Users', description: 'Administrative user management' },
    { name: 'Files', description: 'Upload, browse, download, preview and manage your files' },
    { name: 'Sharing', description: 'Share files with other users and manage permissions' },
    { name: 'Admin', description: 'Platform-wide file administration' },
    { name: 'Stats', description: 'Usage statistics for users and administrators' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
        description:
          'HttpOnly cookie set by `POST /api/v1/auth/login`. The client must send `withCredentials: true`.',
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
              'ForbiddenError',
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
      Permission: {
        type: 'string',
        enum: ['VIEW', 'EDIT'],
        description: 'Share permission level. VIEW allows read-only access; EDIT allows deletion.',
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
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/SafeUser' },
        },
        description: 'Tokens are set as HttpOnly cookies (access_token, refresh_token). The response body contains only the user object.',
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
          url: { type: 'string', format: 'uri', description: 'Cloudinary CDN URL of the file.', example: 'https://res.cloudinary.com/d0u89ige/image/upload/v1/managing-your-files/...' },
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
      FileShare: {
        type: 'object',
        required: ['id', 'fileId', 'sharedById', 'sharedWithId', 'permission', 'createdAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          fileId: { type: 'string', format: 'uuid' },
          sharedById: { type: 'string', format: 'uuid' },
          sharedWithId: { type: 'string', format: 'uuid' },
          sharedBy: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
          sharedWith: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
          file: { $ref: '#/components/schemas/SafeFile' },
          permission: { $ref: '#/components/schemas/Permission' },
          createdAt: { type: 'string', format: 'date-time' },
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
      DailyStorageStat: {
        type: 'object',
        required: ['date', 'bytes'],
        properties: {
          date: { type: 'string', format: 'date', example: '2026-08-14' },
          bytes: { type: 'integer', format: 'int64', example: 10485760 },
        },
      },
      UserStats: {
        type: 'object',
        required: [
          'totalFiles',
          'totalStorageBytes',
          'typeBreakdown',
          'dailyUploads',
          'dailyStorageBytes',
        ],
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
          dailyStorageBytes: {
            type: 'array',
            description: 'Cumulative storage bytes per day for the requested window.',
            items: { $ref: '#/components/schemas/DailyStorageStat' },
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
      UpdateProfileRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100, example: 'Jane Doe' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmPassword'],
        properties: {
          currentPassword: { type: 'string', format: 'password', example: 'Password123' },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 8,
            maxLength: 72,
            description: 'At least 8 characters and must contain at least one number.',
            example: 'NewPassword456',
          },
          confirmPassword: { type: 'string', format: 'password', example: 'NewPassword456' },
        },
      },
      DeleteAccountRequest: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', format: 'password', description: 'Current password to confirm deletion.', example: 'Password123' },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'code', 'password', 'confirmPassword'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          code: { type: 'string', pattern: '^\\d{6}$', example: '483920' },
          password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, example: 'NewPassword456' },
          confirmPassword: { type: 'string', format: 'password', example: 'NewPassword456' },
        },
      },
      ShareFileRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email of the user to share with.', example: 'bob@example.com' },
          permission: { $ref: '#/components/schemas/Permission', default: 'VIEW' },
        },
      },
      UpdateShareRequest: {
        type: 'object',
        required: ['permission'],
        properties: {
          permission: { $ref: '#/components/schemas/Permission' },
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
    // ── Auth ──────────────────────────────────────────────────
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
        description:
          'Authenticates with email and password. Sets `access_token` (15 min) and `refresh_token` (7 days) as HttpOnly cookies. Returns the user object in the body.',
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
            description: 'Authenticated. Cookies are set automatically.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
                example: {
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
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description:
          'Uses the `refresh_token` HttpOnly cookie to issue a new `access_token`. The client interceptor calls this automatically on 401.',
        operationId: 'refreshToken',
        responses: {
          '200': {
            description: 'New access token set as HttpOnly cookie.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SafeUser' },
              },
            },
          },
          '401': errorResponse('Refresh token is missing, invalid or expired.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out',
        description: 'Clears the refresh token from the database and clears both cookie fields.',
        operationId: 'logout',
        responses: {
          '200': {
            description: 'Logged out.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Logged out' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Request a password reset code',
        description:
          'Sends a 6-digit reset code to the email if an account exists. Subject to a 60-second cooldown.',
        operationId: 'forgotPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Message returned (same whether account exists or not).',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'If an account exists, a reset code has been sent' },
              },
            },
          },
          '400': errorResponse('Rate limited.', 'Please wait 60 seconds before requesting another code'),
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password with code',
        description:
          'Verifies the 6-digit code and sets a new password. Invalidates all existing refresh tokens.',
        operationId: 'resetPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password updated.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Password reset successfully' },
              },
            },
          },
          '400': errorResponse('Invalid code, code expired, or passwords do not match.', 'Invalid reset code'),
          '404': errorResponse('No account found for this email.', 'No account found for this email', 'NotFoundError'),
        },
      },
    },
    '/api/v1/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current user',
        description: 'Returns the authenticated user\'s profile.',
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
      put: {
        tags: ['Authentication', 'Settings'],
        summary: 'Update profile name',
        description: 'Updates the authenticated user\'s display name.',
        operationId: 'updateProfile',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
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
          '400': errorResponse('Invalid body.', 'name: Name must be at least 2 characters'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/auth/password': {
      put: {
        tags: ['Authentication', 'Settings'],
        summary: 'Change password',
        description:
          'Changes the authenticated user\'s password. Requires the current password. Invalidates all refresh tokens.',
        operationId: 'changePassword',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Password changed.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Password changed successfully' },
              },
            },
          },
          '400': errorResponse('Invalid body or passwords do not match.', 'passwords: Passwords do not match'),
          '401': errorResponse('Current password is incorrect.', 'Current password is incorrect', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/auth/account': {
      delete: {
        tags: ['Authentication', 'Settings'],
        summary: 'Delete account',
        description:
          'Permanently deletes the authenticated user, their files, shares, and tokens. Requires password confirmation.',
        operationId: 'deleteAccount',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DeleteAccountRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Account deleted.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
                example: { message: 'Account deleted successfully' },
              },
            },
          },
          '400': errorResponse('Invalid password.', 'Password is required to delete account'),
          '401': errorResponse('Password is incorrect.', 'Password is incorrect', 'UnauthorizedError'),
        },
      },
    },

    // ── Users (Admin) ────────────────────────────────────────
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
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
        },
      },
    },
    '/api/v1/users/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update a user\'s role',
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
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
          '404': errorResponse('User not found.', 'User not found', 'NotFoundError'),
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete a user',
        description:
          'Permanently deletes a user, their files, shares and verification codes (cascade). You cannot delete your own account. **ADMIN only.**',
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
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
          '404': errorResponse('User not found.', 'User not found', 'NotFoundError'),
        },
      },
    },

    // ── Files ─────────────────────────────────────────────────
    '/api/v1/files/upload': {
      post: {
        tags: ['Files'],
        summary: 'Upload files',
        description:
          `Uploads up to 10 files at once as \`multipart/form-data\` using the field name \`files\`.\n\nAllowed types: PNG, JPEG, GIF, WebP, BMP, SVG, PDF, DOC, DOCX, ODT, RTF, XLS, XLSX, PPT, PPTX, TXT, Markdown, CSV, HTML, XML, JSON, YAML. Text is extracted from PDF, DOCX and plain-text files.`,
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
          'Paginated list of the authenticated user\'s files. Supports search by name, filtering by extension and sorting.',
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
            description: 'Paginated list of the user\'s files.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedFiles' },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/files/{id}': {
      get: {
        tags: ['Files'],
        summary: 'Get file details',
        description:
          'Returns full file details, including any extracted text. Accessible to the owner, admins, and users the file is shared with.',
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
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('No access to this file.', 'You do not have access to this file', 'ForbiddenError'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
      delete: {
        tags: ['Files'],
        summary: 'Delete a file',
        description:
          'Deletes the file and its Cloudinary asset. Requires EDIT permission, ownership, or ADMIN role.',
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
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('No permission to modify this file.', 'You do not have permission to modify this file', 'ForbiddenError'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
    },
    '/api/v1/files/{id}/download': {
      get: {
        tags: ['Files'],
        summary: 'Download a file',
        description:
          'Streams or redirects to the Cloudinary asset for download. Accessible to the owner, admins, and users the file is shared with.',
        operationId: 'downloadFile',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'File id.' },
        ],
        responses: {
          '200': {
            description: 'File stream (application/octet-stream).',
            content: {
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('No access to this file.', 'You do not have access to this file', 'ForbiddenError'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
    },
    '/api/v1/files/{id}/preview': {
      get: {
        tags: ['Files'],
        summary: 'Preview a file',
        description:
          'Streams or redirects to the Cloudinary asset for inline preview. Accessible to the owner, admins, and users the file is shared with.',
        operationId: 'previewFile',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'File id.' },
        ],
        responses: {
          '200': {
            description: 'File stream with the original MIME type.',
            content: {
              '*/*': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('No access to this file.', 'You do not have access to this file', 'ForbiddenError'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
    },

    // ── Sharing ───────────────────────────────────────────────
    '/api/v1/sharing/{fileId}': {
      post: {
        tags: ['Sharing'],
        summary: 'Share a file',
        description:
          'Shares a file with another user by email. The caller must be the file owner. Default permission is VIEW.',
        operationId: 'shareFile',
        security: bearer,
        parameters: [
          { name: 'fileId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'File id to share.' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ShareFileRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'File shared.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FileShare' },
              },
            },
          },
          '400': errorResponse('Invalid body.', 'email: Invalid email address'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('You can only share your own files.', 'You can only share your own files', 'ForbiddenError'),
          '404': errorResponse('File or user not found.', 'User not found with this email', 'NotFoundError'),
          '409': errorResponse('Already shared with this user.', 'File is already shared with this user', 'ConflictError'),
        },
      },
    },
    '/api/v1/sharing/shared-by-me': {
      get: {
        tags: ['Sharing'],
        summary: 'Files I shared',
        description: 'Returns all files the authenticated user has shared with others.',
        operationId: 'getSharedByMe',
        security: bearer,
        responses: {
          '200': {
            description: 'List of shares created by the user.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/FileShare' },
                },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/sharing/shared-with-me': {
      get: {
        tags: ['Sharing'],
        summary: 'Files shared with me',
        description: 'Returns all files other users have shared with the authenticated user.',
        operationId: 'getSharedWithMe',
        security: bearer,
        responses: {
          '200': {
            description: 'List of shares received by the user.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/FileShare' },
                },
              },
            },
          },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
        },
      },
    },
    '/api/v1/sharing/{id}': {
      put: {
        tags: ['Sharing'],
        summary: 'Update share permission',
        description: 'Changes the permission level of an existing share. The caller must be the one who created the share.',
        operationId: 'updateShare',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Share id.' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateShareRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated share.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/FileShare' },
              },
            },
          },
          '400': errorResponse('Invalid body.', 'permission: Invalid enum value'),
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('You can only update shares you created.', 'You can only update shares you created', 'ForbiddenError'),
          '404': errorResponse('Share not found.', 'Share not found', 'NotFoundError'),
        },
      },
      delete: {
        tags: ['Sharing'],
        summary: 'Remove a share',
        description: 'Removes access for the shared user. Either the creator or the recipient can remove it.',
        operationId: 'removeShare',
        security: bearer,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Share id.' },
        ],
        responses: {
          '204': { description: 'Share removed.' },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Not authorized.', 'Not authorized to remove this share', 'ForbiddenError'),
          '404': errorResponse('Share not found.', 'Share not found', 'NotFoundError'),
        },
      },
    },

    // ── Admin ─────────────────────────────────────────────────
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
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
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
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
          '404': errorResponse('File not found.', 'File not found', 'NotFoundError'),
        },
      },
    },
    '/api/v1/admin/audit-logs': {
      get: {
        tags: ['Admin'],
        summary: 'List audit logs',
        description:
          'Paginated audit log of important actions across the platform. Supports search and filtering. **ADMIN only.**',
        operationId: 'listAuditLogs',
        security: bearer,
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
          { name: 'action', in: 'query', required: false, schema: { type: 'string' }, description: 'Filter by action type.' },
          { name: 'userId', in: 'query', required: false, schema: { type: 'string', format: 'uuid' }, description: 'Filter by user.' },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' }, description: 'Search by user, entity or details.' },
        ],
        responses: {
          '200': { description: 'Paginated audit logs.' },
          '401': errorResponse('Missing or invalid token.', 'Authentication required', 'UnauthorizedError'),
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
        },
      },
    },

    // ── Stats ─────────────────────────────────────────────────
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
              },
            },
          },
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
          '403': errorResponse('Requires the ADMIN role.', 'Insufficient permissions', 'ForbiddenError'),
        },
      },
    },

    // ── Health ────────────────────────────────────────────────
    '/api/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns 200 if the server is running.',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Server is healthy.',
            content: {
              'application/json': {
                example: { status: 'ok' },
              },
            },
          },
        },
      },
    },
  },
};
