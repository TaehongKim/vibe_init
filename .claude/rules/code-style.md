# Code Style Rules

> 이 파일은 CLAUDE.md에서 참조됩니다.  
> 모든 코드 생성 시 아래 규칙을 반드시 따르세요.

---

## 기본 원칙

- **명확성 우선**: 영리한 코드보다 읽기 쉬운 코드
- **일관성**: 파일마다 스타일이 달라지면 안 됨
- **최소화**: 필요한 것만 만들고, 필요 없어진 것은 즉시 제거

---

## TypeScript

### 타입 엄격성

```typescript
// ✅ 항상 명시적 타입
const getReport = async (id: string): Promise<Report> => { ... }

// ❌ any 사용 금지 — 이유 없이 any를 쓰면 타입 시스템이 무의미해짐
const data: any = await fetch(...)

// ❌ as 캐스팅 남용 금지
const report = data as Report  // 검증 없는 캐스팅

// ✅ 대신 Zod로 런타임 검증 후 타입 확보
const report = reportSchema.parse(data)
```

### 타입 정의 위치

```typescript
// 공통 타입 → types/index.ts
// API 요청/응답 타입 → types/api.ts
// 특정 도메인에만 쓰이는 타입 → 해당 파일 상단에 로컬 정의

// ✅ export 방식: named export만 사용 (default export 금지)
export type { Report, ReportStatus, PaginatedResponse }
```

### 유틸리티 타입 활용

```typescript
// 불필요한 타입 중복 대신 유틸리티 타입 사용
type CreateReportInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>
type ReportSummary = Pick<Report, 'id' | 'title' | 'authors' | 'year'>
type PartialReport = Partial<Pick<Report, 'title' | 'abstract' | 'tags'>>
```

### Enum 대신 const 객체

```typescript
// ❌ TypeScript enum (런타임 오버헤드, 트리쉐이킹 불가)
enum ReportStatus { PENDING, APPROVED }

// ✅ const 객체 + 타입 추출
export const REPORT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED',
} as const

export type ReportStatus = typeof REPORT_STATUS[keyof typeof REPORT_STATUS]
```

---

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수, 함수 | camelCase | `reportList`, `getReport()` |
| 컴포넌트 | PascalCase | `ReportCard`, `SearchBar` |
| 파일명 (컴포넌트) | PascalCase | `ReportCard.tsx` |
| 파일명 (그 외) | kebab-case | `search-utils.ts`, `auth-helpers.ts` |
| 상수 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE` |
| 타입/인터페이스 | PascalCase | `Report`, `SearchResult` |
| Zod 스키마 | camelCase + Schema | `createReportSchema` |
| Server Action | 동사 + 명사 | `createReport`, `deleteReport` |
| API Route 파일 | `route.ts` 고정 | `app/api/reports/route.ts` |
| 환경변수 | UPPER_SNAKE_CASE | `DATABASE_URL`, `NEXTAUTH_SECRET` |

### 함수명 동사 규칙

```typescript
// 데이터 조회 → get / fetch / find / search
getReport(id)        // 단건, 없으면 throw
findReport(id)       // 단건, 없으면 null
fetchReports()       // 목록
searchReports(query) // 검색

// 데이터 변경 → create / update / delete / archive
createReport(data)
updateReport(id, data)
deleteReport(id)
archiveReport(id)

// 검증 → validate / check / is / has / can
validateFile(file)
isAdmin(user)
hasPermission(user, action)
canEditReport(user, report)

// 변환 → format / parse / transform / convert
formatFileSize(bytes)
parseSearchParams(params)
```

---

## React & Next.js

### Server Component vs Client Component

```typescript
// Server Component가 기본 — 'use client' 없으면 서버에서 실행
// ✅ 데이터 페칭, DB 접근 → Server Component
// ✅ 이벤트 핸들러, useState, useEffect → Client Component ('use client')
// ✅ 서드파티 라이브러리 (차트, 에디터 등) → Client Component

// 규칙: Client Component는 트리의 최대한 아래(leaf)에 위치
// 이유: 상위 컴포넌트가 'use client'면 하위 전체가 클라이언트로 번들됨
```

### 컴포넌트 구조

```typescript
// ✅ 권장 순서
'use client' // (필요한 경우만)

import { ... } from 'react'         // React 관련
import { ... } from 'next/...'      // Next.js 관련
import { ... } from '@/lib/...'     // 내부 lib
import { ... } from '@/components'  // 내부 컴포넌트
import type { ... } from '@/types'  // 타입 (마지막)

interface Props {                    // Props 타입
  id: string
  className?: string
}

export function ReportCard({ id, className }: Props) {  // named export
  // 1. hooks
  // 2. 파생 상태/변수
  // 3. 핸들러 함수
  // 4. return JSX
}
```

### Props 규칙

```typescript
// ✅ 선택적 props는 명시적 기본값
function SearchBar({ placeholder = '검색어를 입력하세요', isLoading = false }: Props) {}

// ✅ children은 React.ReactNode
interface LayoutProps {
  children: React.ReactNode
  className?: string
}

// ❌ 불필요한 wrapper div 금지
return (
  <div>          {/* 이유 없는 wrapper */}
    <Component />
  </div>
)

// ✅ Fragment 사용
return (
  <>
    <Component />
  </>
)
```

### 조건부 렌더링

```typescript
// ✅ 단순 조건 → && 또는 삼항
{isLoading && <Spinner />}
{error ? <ErrorState message={error} /> : <Content />}

// ✅ 복잡한 조건 → 함수로 분리
function renderContent() {
  if (isLoading) return <Spinner />
  if (error) return <ErrorState message={error} />
  if (!data) return <EmptyState />
  return <ReportList data={data} />
}
return <div>{renderContent()}</div>

// ❌ 중첩 삼항 금지
{a ? b ? <C /> : <D /> : <E />}
```

---

## 비동기 처리

```typescript
// ✅ async/await — Promise 체인 금지
const report = await getReport(id)

// ✅ 에러는 try-catch로 명시적 처리
try {
  const report = await createReport(data)
  return { success: true, data: report }
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    // 알려진 에러: 구체적으로 처리
    return { success: false, error: '이미 존재하는 보고서입니다' }
  }
  // 알 수 없는 에러: 로그 + 제네릭 메시지
  console.error('[createReport]', error)
  return { success: false, error: '서버 오류가 발생했습니다' }
}

// ✅ Promise.all — 독립적인 비동기 작업은 병렬로
const [reports, tags, user] = await Promise.all([
  getReports(),
  getTags(),
  getUser(session.user.id),
])
```

---

## 임포트 순서

```typescript
// 1. Node.js 내장
import { readFile } from 'fs/promises'

// 2. 외부 패키지
import { z } from 'zod'
import { NextResponse } from 'next/server'

// 3. 내부 — lib, utils
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'

// 4. 내부 — 컴포넌트
import { SearchBar } from '@/components/search/SearchBar'

// 5. 내부 — 타입 (type 키워드 명시)
import type { Report, SearchResult } from '@/types'

// 빈 줄로 그룹 구분
```

---

## 주석

```typescript
// ✅ 코드가 '무엇'을 하는지는 코드 자체로, '왜'를 주석으로
// LDAP DN 형식 예시: uid=사용자명,ou=users,dc=[조직],dc=[도메인]
const dn = `uid=${username},${process.env.LDAP_BASE_DN}`

// ✅ TODO는 이슈 번호와 함께
// TODO(#42): ES 장애 시 PG fallback 구현 필요

// ❌ 코드와 일치하지 않는 주석 (최악)
// 보고서를 삭제한다
const report = await db.report.findUnique(...)  // 사실은 조회

// ❌ 당연한 것 설명
// i를 1씩 증가
i++
```

---

## Tailwind CSS

```typescript
// ✅ cn() 유틸로 조건부 클래스 관리
import { cn } from '@/lib/utils'

<div className={cn(
  'rounded-lg border p-4',           // 기본
  isActive && 'border-blue-500',     // 조건부
  className,                          // 외부 주입
)} />

// ✅ 복잡한 클래스는 변수로 분리
const badgeVariants = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

<span className={badgeVariants[status]} />

// ❌ 인라인 style 금지 (Tailwind로 대체 가능한 경우)
<div style={{ marginTop: '16px' }} />   // ❌
<div className="mt-4" />                // ✅
```

---

## 파일 길이 & 분리 기준

| 기준 | 조치 |
|------|------|
| 컴포넌트 150줄 초과 | 서브 컴포넌트로 분리 |
| 함수 30줄 초과 | 함수 분리 검토 |
| 중복 로직 3회 이상 | 공통 함수/훅으로 추출 |
| 파일 300줄 초과 | 분리 필요 신호 |

```typescript
// ✅ 컴포넌트 분리 예시
// ❌ ReportDetail.tsx 에 모든 것
// ✅ ReportDetail.tsx → ReportHeader + ReportBody + ReportActions 로 분리
```