# Security Rules

> 이 파일은 CLAUDE.md에서 참조됩니다.  
> 보안 규칙은 성능·편의보다 항상 우선합니다.  
> 아래 규칙을 어기는 코드는 리뷰에서 반드시 차단됩니다.

---

## 핵심 원칙

1. **입력을 신뢰하지 않는다** — 모든 외부 입력은 검증 후 사용
2. **최소 권한** — 필요한 권한만, 필요한 시간만
3. **실패 시 닫힘** — 에러 발생 시 접근 허용이 아닌 거부
4. **심층 방어** — 한 층이 뚫려도 다음 층이 막음

---

## 인증 & 인가

### 모든 보호 경로에 인증 체크

```typescript
// ✅ middleware.ts — 라우트 레벨 보호 (1차 방어선)
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})

export const config = {
  matcher: ['/(auth)/:path*', '/admin/:path*'],
}

// ✅ API Route — 서버 레벨 보호 (2차 방어선, 반드시 추가)
// middleware만 믿지 말 것 — API는 직접 호출 가능
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다', code: 'UNAUTHORIZED' }, { status: 401 })
  }
  // ...
}
```

### 역할 기반 접근 제어

```typescript
// ✅ 관리자 전용 API
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다', code: 'FORBIDDEN' }, { status: 403 })
  }

  // 관리자 전용 로직
}

// ✅ 본인 또는 관리자만 수정 가능
async function canEditReport(userId: string, reportId: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session) return false
  if (session.user.role === 'ADMIN') return true

  const report = await db.report.findUnique({ where: { id: reportId } })
  return report?.authorId === session.user.id
}
```

### Session 토큰 규칙

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,  // 8시간 — 하루 업무 시간
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role  // role을 토큰에 포함
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.id = token.id as string
      return session
    },
  },
}
```

---

## 입력값 검증

### 모든 API 입력은 Zod로 검증

```typescript
// ✅ API Route에서 body 검증
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return unauthorized()

  const body = await request.json()
  const parsed = createReportSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: '잘못된 입력입니다', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // parsed.data 는 타입 안전 — 이후 코드에서 raw body 사용 금지
  const report = await createReport(parsed.data)
}

// ✅ 검색 파라미터 검증
const searchParamsSchema = z.object({
  q: z.string().min(2).max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
  tag: z.string().max(50).optional(),
})
```

### 파일 업로드 검증

```typescript
// ✅ 허용 MIME 타입 화이트리스트
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const

// ✅ 파일 크기 제한
const MAX_FILE_SIZE = 100 * 1024 * 1024  // 100MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `파일 크기는 100MB 이하여야 합니다 (현재: ${formatFileSize(file.size)})` }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return { valid: false, error: 'PDF, DOCX, PPTX 파일만 업로드 가능합니다' }
  }

  return { valid: true }
}

// ✅ 서버에서도 MIME 타입 재검증 (클라이언트 검증만 믿지 않음)
// Content-Type 헤더는 위조 가능 — 파일 매직 바이트로 실제 타입 확인
import { fileTypeFromBuffer } from 'file-type'

const buffer = await file.arrayBuffer()
const fileType = await fileTypeFromBuffer(buffer)

if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime as any)) {
  return NextResponse.json({ error: '허용되지 않는 파일 형식입니다', code: 'INVALID_FILE_TYPE' }, { status: 400 })
}
```

---

## SQL Injection 방어

```typescript
// ✅ Prisma ORM 사용 — 파라미터화된 쿼리 자동 적용
const reports = await db.report.findMany({
  where: { title: { contains: searchQuery } }  // 안전
})

// ❌ 절대 금지 — raw 쿼리에 문자열 직접 삽입
const reports = await db.$queryRaw`SELECT * FROM reports WHERE title LIKE '%${searchQuery}%'`
// 위와 같이 템플릿 리터럴 직접 삽입은 Prisma가 파라미터화하지 않음

// ✅ raw 쿼리가 꼭 필요한 경우 — Prisma.sql 태그 사용
const reports = await db.$queryRaw(
  Prisma.sql`SELECT * FROM reports WHERE title LIKE ${`%${searchQuery}%`}`
)
```

---

## XSS 방어

```typescript
// Next.js의 JSX는 기본적으로 XSS 방어 — innerHTML은 사용 금지
// ❌ 절대 금지
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ 마크다운 렌더링이 필요한 경우 — sanitize 후 사용
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(markdownHtml)
<div dangerouslySetInnerHTML={{ __html: clean }} />

// ✅ 사용자 입력을 URL에 넣을 때 인코딩
const searchUrl = `/search?q=${encodeURIComponent(userQuery)}`
```

---

## HTTP 보안 헤더

```typescript
// next.config.ts — 프로덕션 배포 시 필수
const securityHeaders = [
  // XSS 방어
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // MIME 타입 스니핑 방어
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 클릭재킹 방어
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // HTTPS 강제
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // 레퍼러 정보 제한
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // CSP
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js 요구
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${process.env.ELASTICSEARCH_URL} ${process.env.MINIO_ENDPOINT}`,
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

export default {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
}
```

---

## 환경변수 & 시크릿

```typescript
// ✅ 서버 전용 변수 접근 — 클라이언트에 노출 금지
// NEXT_PUBLIC_ 접두사가 없는 변수는 서버에서만 접근 가능

// ❌ 절대 금지 — 시크릿을 클라이언트 번들에 포함
'use client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
// DATABASE_URL은 NEXT_PUBLIC_ 없어도 클라이언트에서 undefined이지만
// 실수로 NEXT_PUBLIC_DATABASE_URL 로 선언하면 완전히 노출됨

// ✅ 서버 전용 변수는 lib/env.ts에서 중앙 관리
// 빌드 시 누락된 변수 조기 감지
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  LDAP_URL: z.string(),
  ELASTICSEARCH_URL: z.string().url(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
})

export const env = envSchema.parse(process.env)
// 누락 시 서버 시작 단계에서 ZodError로 즉시 감지

// ❌ 코드에 시크릿 하드코딩 절대 금지
const secret = 'my-hardcoded-secret'  // git에 올라가면 영구 노출
```

---

## MinIO 파일 접근 제어

```typescript
// ✅ presigned URL만 사용 — MinIO 버킷을 public으로 열지 않음
// 파일 직접 접근 URL 대신 만료 시간이 있는 서명된 URL 발급

import { Client } from 'minio'

const minio = new Client({ ... })

// 업로드용 presigned URL (5분 만료)
export async function getUploadUrl(objectName: string): Promise<string> {
  return minio.presignedPutObject('kiom-files', objectName, 5 * 60)
}

// 다운로드용 presigned URL (1시간 만료)
// 로그인한 사용자에게만 발급
export async function getDownloadUrl(objectName: string): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('UNAUTHORIZED')

  return minio.presignedGetObject('kiom-files', objectName, 60 * 60)
}

// ❌ 절대 금지 — 파일 URL을 DB에 public URL로 저장
// fileUrl: 'https://minio.kiom.re.kr/kiom-files/report.pdf'  ← 직접 접근 가능
```

---

## Rate Limiting

```typescript
// ✅ 인증 엔드포인트에 rate limit 적용 (brute force 방어)
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache'

const rateLimit = new LRUCache<string, number>({
  max: 500,
  ttl: 60 * 1000,  // 1분
})

export function checkRateLimit(ip: string, limit = 10): boolean {
  const current = rateLimit.get(ip) ?? 0
  if (current >= limit) return false
  rateLimit.set(ip, current + 1)
  return true
}

// 로그인 API에 적용
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 5)) {  // 1분에 5번
    return NextResponse.json(
      { error: '너무 많은 시도입니다. 잠시 후 다시 시도해주세요', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }
  // 로그인 처리
}
```

---

## 에러 응답 규칙

```typescript
// ✅ 에러 메시지에 내부 정보 포함 금지
// ❌ 나쁜 예 — 공격자에게 정보 제공
return NextResponse.json({
  error: 'PrismaClientKnownRequestError: Unique constraint failed on column: email',
  stack: error.stack,
})

// ✅ 좋은 예 — 사용자 친화적 + 내부 정보 숨김
console.error('[POST /api/reports]', error)  // 서버 로그에만 상세 기록
return NextResponse.json(
  { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
  { status: 500 }
)

// ✅ 존재 여부도 숨겨야 하는 경우 (user enumeration 방어)
// 로그인: "이메일 또는 비밀번호가 올바르지 않습니다" (이메일 존재 여부 숨김)
// 비밀번호 재설정: "해당 이메일로 안내 메일을 발송했습니다" (존재 여부 숨김)
```

---

## 보안 감사 체크리스트

새 API Route 또는 Server Action 추가 시 반드시 확인:

```
□ 인증 체크 추가 (getServerSession)
□ 역할 검증 (role === 'ADMIN' 또는 본인 확인)
□ 입력값 Zod 검증
□ 에러 응답에 내부 정보 미포함
□ DB 쿼리에 raw 문자열 삽입 없음
□ 파일 처리 시 MIME 타입 서버 검증
□ 민감한 필드가 응답에 포함되지 않음 (비밀번호 해시 등)
```

새 파일 업로드 기능 추가 시:

```
□ 파일 크기 제한 (클라이언트 + 서버 모두)
□ MIME 타입 화이트리스트 검증 (매직 바이트 기반)
□ 파일명 sanitize (path traversal 방어)
□ presigned URL 사용 (MinIO 직접 노출 금지)
□ 업로드 후 바이러스 스캔 큐 등록
```