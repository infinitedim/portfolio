# Phase 1: API Responses Documentation

Dokumentasi ini mencatat struktur response dari semua API endpoints yang ada sebelum migrasi.

## tRPC Endpoints

### Health Endpoints

#### `health.check`
**Type:** Query  
**Response:**
```typescript
{
  status: "ok",
  timestamp: string // ISO 8601
}
```

#### `health.detailed`
**Type:** Query  
**Response:**
```typescript
{
  status: "healthy" | "unhealthy",
  timestamp: string,
  checks: {
    database: { status: "healthy" | "unhealthy", error?: string },
    redis: { status: "healthy" | "unhealthy" | "not configured", error?: string }
  }
}
```

#### `health.database`
**Type:** Query  
**Response:**
```typescript
{
  status: "healthy" | "unhealthy",
  responseTime?: number,
  details?: unknown,
  error?: string
}
```

#### `health.redis`
**Type:** Query  
**Response:**
```typescript
{
  status: "healthy" | "unhealthy",
  responseTime?: number,
  details?: unknown,
  error?: string
}
```

#### `health.memory`
**Type:** Query  
**Response:**
```typescript
{
  status: "healthy" | "unhealthy",
  responseTime?: number,
  details?: unknown,
  error?: string
}
```

#### `health.system`
**Type:** Query  
**Response:**
```typescript
{
  status: "healthy" | "unhealthy",
  responseTime?: number,
  details?: unknown,
  error?: string
}
```

#### `health.ready`
**Type:** Query  
**Response:**
```typescript
{
  status: "ready" | "not ready",
  timestamp: string,
  uptime?: number,
  reason?: string,
  checks?: {
    database: string,
    redis: string
  },
  error?: string
}
```

#### `health.live`
**Type:** Query  
**Response:**
```typescript
{
  status: "alive" | "not alive",
  timestamp: string,
  uptime?: number,
  overallStatus?: string,
  reason?: string,
  error?: string
}
```

### Auth Endpoints

#### `auth.login`
**Type:** Mutation  
**Input:**
```typescript
{
  email: string,
  password: string
}
```
**Response:**
```typescript
{
  success: true,
  user: {
    userId: string,
    email: string,
    role: "admin"
  },
  accessToken: string,
  refreshToken: string
} | {
  success: false,
  error: string
}
```

#### `auth.refresh`
**Type:** Mutation  
**Input:**
```typescript
{
  refreshToken: string
}
```
**Response:**
```typescript
{
  success: true,
  accessToken: string,
  refreshToken: string
} | {
  success: false,
  error: string
}
```

#### `auth.logout`
**Type:** Mutation  
**Input:**
```typescript
{
  accessToken: string
}
```
**Response:**
```typescript
{
  success: true
}
```

#### `auth.validate`
**Type:** Mutation  
**Input:**
```typescript
{
  accessToken: string
}
```
**Response:**
```typescript
{
  success: true,
  user: {
    userId: string,
    email: string,
    role: "admin"
  }
} | {
  success: false,
  error: string
}
```

#### `auth.me`
**Type:** Query  
**Response:**
```typescript
{
  user: {
    userId: string,
    email: string,
    role: "admin"
  }
} | null
```

### Projects Endpoints

#### `projects.get`
**Type:** Query  
**Input (optional):**
```typescript
{
  section?: string,
  limit?: number // max 100
}
```
**Response:**
```typescript
{
  data: Array<{
    id: string,
    name: string,
    slug: string,
    description: string | null,
    tech: string[],
    featured: boolean,
    status: string,
    url: string | null,
    githubUrl: string | null,
    imageUrl: string | null,
    createdAt: Date
  }>,
  meta?: {
    section?: string
  }
}
```

#### `projects.getBySlug`
**Type:** Query  
**Input:**
```typescript
{
  slug: string
}
```
**Response:**
```typescript
{
  id: string,
  name: string,
  slug: string,
  description: string | null,
  tech: string[],
  featured: boolean,
  status: string,
  url: string | null,
  githubUrl: string | null,
  imageUrl: string | null,
  createdAt: Date
} | null
```

#### `projects.getFeatured`
**Type:** Query  
**Response:**
```typescript
Array<{
  id: string,
  name: string,
  slug: string,
  description: string | null,
  tech: string[],
  featured: boolean,
  status: string,
  url: string | null,
  githubUrl: string | null,
  imageUrl: string | null,
  createdAt: Date
}>
```

### Spotify Endpoints

#### `spotify.nowPlaying`
**Type:** Query  
**Response:**
```typescript
{
  isPlaying: boolean,
  progress?: number,
  duration?: number,
  songUrl?: string,
  albumArt?: string,
  title?: string,
  artist?: string,
  album?: string
}
```

### Security Endpoints

#### `security.validateInput`
**Type:** Mutation  
**Input:**
```typescript
{
  input: string
}
```
**Response:**
```typescript
{
  isValid: boolean,
  sanitizedInput: string,
  error: string | null,
  riskLevel: "low" | "medium" | "high"
}
```

#### `security.checkRateLimit`
**Type:** Mutation  
**Input:**
```typescript
{
  key: string,
  type: string
}
```
**Response:**
```typescript
{
  allowed: boolean,
  remaining: number
}
```

#### `security.getCSRFToken`
**Type:** Query  
**Response:**
```typescript
{
  token: string
}
```

### Utility Endpoints

#### `echo`
**Type:** Query  
**Input:**
```typescript
{
  msg: string
}
```
**Response:**
```typescript
{
  msg: string
}
```

---

## REST API Endpoints (NestJS Controllers)

### AI Endpoints

#### `POST /ai/chat`
**Headers:**
- `Content-Type: application/json`

**Body:**
```typescript
{
  messages: Array<{
    role: "system" | "user" | "assistant" | "data",
    content: any
  }>
}
```

**Response:**
- **Content-Type:** `text/plain; charset=utf-8`
- **Transfer-Encoding:** `chunked`
- **Body:** Streaming text response from AI

**Rate Limit:** 10 requests per minute

---

## Error Responses

### tRPC Errors
```typescript
{
  error: {
    message: string,
    code: string, // "TOO_MANY_REQUESTS", "UNAUTHORIZED", "BAD_REQUEST", etc.
    data?: {
      code: string,
      httpStatus: number
    }
  }
}
```

### REST API Errors
```typescript
{
  statusCode: number,
  message: string | string[],
  error: string
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- All dates are returned as Date objects in tRPC (serialized to ISO strings in JSON)
- Rate limiting is applied per endpoint with different limits
- Auth tokens are stored in Redis with TTL:
  - Access tokens: 1 hour (3600 seconds)
  - Refresh tokens: 7 days (604800 seconds)

