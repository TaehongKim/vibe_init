# 코딩 규칙

## 일반

- TypeScript strict mode (`any` 사용 금지)
- `console.log` 커밋 전 제거
- 함수·변수명: 영어 camelCase / 컴포넌트: PascalCase / 파일: kebab-case
- 주석: 한국어 (코드가 명확하면 생략)

## Next.js App Router

- Server Component 기본 — `'use client'`는 이벤트 핸들러·useState·useEffect 필요 시만
- 렌더링 전략: 메인=SSG, 검색=SSR, 상세=ISR(1h), 대시보드=CSR

| 케이스 | 선택 |
|--------|------|
| 폼 제출 (등록·수정·삭제) | Server Action |
| 파일 업로드 presigned URL | API Route |
| 검색 (캐시 필요) | Server Action + `unstable_cache` |
| 외부 webhook, 스트리밍 | API Route |

## 에러 처리

```typescript
// API Route
return NextResponse.json({ error: '설명', code: 'ERROR_CODE' }, { status: 400 })

// Server Action
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }
```

## 입력값 검증

```typescript
// lib/validations.ts에 Zod 스키마 중앙 관리
export const createReportSchema = z.object({
  title: z.string().min(1).max(200),
})
```

## Prisma

```typescript
import { db } from '@/lib/db'  // 싱글톤만 사용

// N+1 방지: include/select 명시
const report = await db.report.findUnique({
  where: { id },
  include: { tags: true, author: { select: { name: true } } }
})
```

## 인증·권한

```typescript
// 보호 경로는 middleware.ts에서만 처리
const session = await getServerSession(authOptions)
if (!session || session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: '권한 없음', code: 'UNAUTHORIZED' }, { status: 403 })
}
```

## 절대 하지 말 것

- `any` 타입 / `console.log` 프로덕션 잔류
- DB 쿼리를 컴포넌트 파일 직접 작성 (`actions/` 또는 `lib/` 경유)
- 인증 체크 없이 관리자 기능 / `getServerSession` 없이 데이터 변경
- `rules/security.md` 미확인 상태로 새 API 추가
- 환경 변수 하드코딩 / CSS-in-JS 라이브러리 추가 / `dangerouslySetInnerHTML` (검토 없이)
