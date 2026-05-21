# Testing Rules

> 이 파일은 CLAUDE.md에서 참조됩니다.  
> 테스트 작성 시 아래 규칙을 반드시 따르세요.

---

## 테스트 전략 요약

| 레이어 | 도구 | 목표 커버리지 | 작성 시점 |
|--------|------|--------------|-----------|
| 단위 테스트 | Vitest | 60% | 함수 구현과 동시 |
| 컴포넌트 테스트 | Vitest + Testing Library | 주요 컴포넌트 | 컴포넌트 완성 후 |
| E2E 테스트 | Playwright + **Playwright MCP** | 핵심 플로우 5개 | M2 완료 후 |

> **Playwright MCP** (`@executeautomation/playwright-mcp-server`): 브라우저를 AI가 직접 조작해 테스트 코드를 자동 생성하고 실행한다. E2E 작성 시 우선 사용할 것.

**핵심 E2E 플로우 5개**

1. 로그인 → 대시보드 접근
2. 보고서 등록 → 파일 업로드 → 완료 확인
3. 키워드 검색 → 필터 적용 → 상세 페이지 이동
4. 관리자 로그인 → 승인 처리
5. 비로그인 상태 → 보호 경로 접근 → 로그인 리다이렉트

---

## 디렉토리 구조

```
tests/
├── unit/
│   ├── lib/
│   │   ├── auth.test.ts
│   │   ├── elasticsearch.test.ts
│   │   └── validations.test.ts
│   ├── actions/
│   │   ├── report.test.ts
│   │   └── search.test.ts
│   └── utils/
│       └── format.test.ts
├── components/
│   ├── search/
│   │   └── SearchBar.test.tsx
│   └── upload/
│       └── UploadForm.test.tsx
└── e2e/
    ├── auth.spec.ts
    ├── report-upload.spec.ts
    ├── search.spec.ts
    ├── admin-approval.spec.ts
    └── protected-routes.spec.ts
```

---

## 단위 테스트 (Vitest)

### 파일 네이밍

```
대상 파일: lib/validations.ts
테스트 파일: tests/unit/lib/validations.test.ts
```

### 기본 구조

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createReportSchema } from '@/lib/validations'

describe('createReportSchema', () => {
  describe('title 검증', () => {
    it('빈 문자열이면 에러를 반환한다', () => {
      const result = createReportSchema.safeParse({ title: '' })
      expect(result.success).toBe(false)
    })

    it('200자 초과면 에러를 반환한다', () => {
      const result = createReportSchema.safeParse({ title: 'a'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('정상 입력이면 파싱에 성공한다', () => {
      const result = createReportSchema.safeParse({ title: '유효한 제목' })
      expect(result.success).toBe(true)
    })
  })
})
```

### 테스트 제목 규칙

```typescript
// ✅ 한국어로, "~하면 ~한다" 형식
it('파일 크기가 100MB를 초과하면 ValidationError를 던진다', ...)
it('인증 토큰이 없으면 UNAUTHORIZED를 반환한다', ...)
it('검색어가 2자 미만이면 빈 배열을 반환한다', ...)

// ❌ 모호한 제목
it('works', ...)
it('test 1', ...)
it('should return something', ...)
```

### 외부 의존성 모킹

```typescript
// Prisma 모킹
import { vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    report: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// 사용 예
import { db } from '@/lib/db'

it('보고서가 없으면 null을 반환한다', async () => {
  vi.mocked(db.report.findUnique).mockResolvedValueOnce(null)
  const result = await getReport('non-existent-id')
  expect(result).toBeNull()
})
```

### 에러 케이스를 항상 테스트

```typescript
describe('createReport', () => {
  it('정상 입력이면 보고서를 생성한다', async () => { ... })
  it('제목이 없으면 ValidationError를 던진다', async () => { ... })  // ← 이게 더 중요
  it('인증 없이 호출하면 UNAUTHORIZED를 반환한다', async () => { ... })
  it('중복 파일이면 DUPLICATE_FILE 에러를 반환한다', async () => { ... })
})
```

### 테스트 데이터 팩토리

```typescript
// tests/factories/report.ts — 테스트용 목 데이터 중앙 관리
export function createMockReport(overrides?: Partial<Report>): Report {
  return {
    id: 'test-id-001',
    title: '한의학 치료 효과 연구',
    abstract: '본 연구는...',
    authors: ['홍길동', '김철수'],
    year: 2025,
    fileUrl: 'https://minio.example.com/reports/test.pdf',
    fileSize: 1024 * 1024,
    mimeType: 'application/pdf',
    status: 'APPROVED',
    isPublic: true,
    viewCount: 0,
    tags: [],
    authorId: 'user-001',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

// 사용
const pendingReport = createMockReport({ status: 'PENDING' })
const privateReport = createMockReport({ isPublic: false })
```

---

## 컴포넌트 테스트 (Testing Library)

### 기본 구조

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from '@/components/search/SearchBar'

describe('SearchBar', () => {
  it('Enter 키 입력 시 onSearch가 호출된다', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)

    const input = screen.getByRole('searchbox')
    await userEvent.type(input, '한의학{Enter}')

    expect(onSearch).toHaveBeenCalledWith('한의학')
  })

  it('isLoading이 true면 입력창이 비활성화된다', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading />)
    expect(screen.getByRole('searchbox')).toBeDisabled()
  })

  it('검색어 2자 미만이면 경고 메시지가 표시된다', async () => {
    render(<SearchBar onSearch={vi.fn()} />)
    await userEvent.type(screen.getByRole('searchbox'), '가')
    expect(screen.getByText('2자 이상 입력해주세요')).toBeInTheDocument()
  })
})
```

### 쿼리 우선순위

```typescript
// 1순위: 접근성 역할 (실제 사용자 경험과 일치)
screen.getByRole('button', { name: '검색' })
screen.getByRole('searchbox')
screen.getByRole('heading', { name: '검색 결과' })

// 2순위: 레이블 텍스트
screen.getByLabelText('제목')
screen.getByPlaceholderText('검색어를 입력하세요')

// 3순위: 텍스트 내용
screen.getByText('보고서를 찾을 수 없습니다')

// ❌ 마지막 수단 (구현 상세에 의존)
screen.getByTestId('search-input')  // 가능하면 피할 것
```

---

## E2E 테스트 (Playwright + Playwright MCP)

### Playwright MCP로 테스트 코드 자동 생성 (권장 워크플로우)

새 E2E 테스트를 작성할 때는 직접 코드를 쓰기 전에 **Playwright MCP 코드 생성 세션**을 먼저 사용한다.

```
1. start_codegen_session 호출 → 세션 ID 획득
2. Playwright_navigate, Playwright_click, Playwright_fill 등으로 직접 플로우 실행
3. Playwright_screenshot 으로 각 단계 스크린샷 확인
4. end_codegen_session 호출 → tests/e2e/*.spec.ts 파일 자동 생성
5. 생성된 코드를 검토 후 필요한 assertion 보강
```

**예시: 로그인 플로우 자동 생성**

```
// MCP 도구 호출 순서
start_codegen_session({ outputPath: "tests/e2e/auth.spec.ts" })
Playwright_navigate({ url: "http://localhost:3000/login" })
Playwright_fill({ selector: "[name=username]", value: "test_user" })
Playwright_fill({ selector: "[name=password]", value: "test_pass" })
Playwright_click({ selector: "button[type=submit]" })
Playwright_screenshot({ name: "after-login" })
end_codegen_session()
```

### 파일 구조

```typescript
// tests/e2e/auth.spec.ts — Playwright MCP로 생성 후 검토·보강
import { test, expect } from '@playwright/test'

test.describe('인증', () => {
  test('LDAP 계정으로 로그인하면 대시보드로 이동한다', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="username"]', process.env.TEST_USERNAME!)
    await page.fill('[name="password"]', process.env.TEST_PASSWORD!)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: '내 성과물' })).toBeVisible()
  })

  test('잘못된 계정으로 로그인하면 에러 메시지가 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="username"]', 'wrong-user')
    await page.fill('[name="password"]', 'wrong-pass')
    await page.click('button[type="submit"]')

    await expect(page.getByText('로그인 정보를 확인해주세요')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('비로그인 상태로 대시보드 접근 시 로그인 페이지로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login?callbackUrl=/dashboard')
  })
})
```

### 인증 상태 재사용 (storageState)

```typescript
// playwright.config.ts — 로그인 한 번, 테스트 전체에서 재사용
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: '**/e2e/auth.setup.ts',  // 로그인 후 storageState 저장
    },
    {
      name: 'authenticated',
      use: { storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
})

// tests/e2e/auth.setup.ts
import { test as setup } from '@playwright/test'

setup('로그인 상태 저장', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="username"]', process.env.TEST_USERNAME!)
  await page.fill('[name="password"]', process.env.TEST_PASSWORD!)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
  await page.context().storageState({ path: 'playwright/.auth/user.json' })
})
```

### 페이지 오브젝트 패턴 (복잡한 플로우)

```typescript
// tests/e2e/pages/UploadPage.ts
export class UploadPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/upload')
  }

  async fillTitle(title: string) {
    await this.page.fill('[name="title"]', title)
  }

  async uploadFile(filePath: string) {
    await this.page.setInputFiles('input[type="file"]', filePath)
  }

  async submit() {
    await this.page.click('button[type="submit"]')
  }

  async expectSuccess() {
    await expect(this.page.getByText('등록이 완료되었습니다')).toBeVisible()
  }
}

// 사용
test('보고서 등록 플로우', async ({ page }) => {
  const uploadPage = new UploadPage(page)
  await uploadPage.goto()
  await uploadPage.fillTitle('테스트 보고서')
  await uploadPage.uploadFile('tests/fixtures/sample.pdf')
  await uploadPage.submit()
  await uploadPage.expectSuccess()
})
```

---

## 테스트 금지 사항

```typescript
// ❌ 구현 상세 테스트 (리팩토링 내성 없음)
expect(component.state.isLoading).toBe(true)
expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ _internal: true }))

// ❌ 테스트끼리 의존 (실행 순서 의존)
test('B', () => {
  // A 테스트가 먼저 실행됐다고 가정 — 절대 금지
})

// ❌ 실제 외부 서비스 호출 (단위 테스트에서)
it('검색', async () => {
  const result = await searchElasticsearch('한의학')  // 실제 ES 호출 — 금지
})

// ❌ 타임아웃 하드코딩
await new Promise(r => setTimeout(r, 3000))  // waitFor 사용

// ✅ 대신
await waitFor(() => expect(screen.getByText('완료')).toBeInTheDocument())
```

---

## E2E 실패 디버깅 (Playwright MCP 활용)

테스트가 실패하면 Playwright MCP 도구로 원인을 직접 확인한다.

```
// 실패한 URL로 이동
Playwright_navigate({ url: "http://localhost:3000/실패한-경로" })

// 스크린샷으로 현재 상태 확인
Playwright_screenshot({ name: "debug-state" })

// 콘솔 에러 수집
Playwright_console_logs({ type: "error" })

// HTML 구조 확인 (셀렉터 문제 파악)
playwright_get_visible_html({})

// JavaScript로 상태 직접 조회
Playwright_evaluate({ script: "document.querySelector('[data-testid=error]')?.textContent" })
```

---

## CI에서 테스트 실행

```yaml
# .github/workflows/ci.yml 기준
# 단위 + 컴포넌트 테스트: 모든 PR에서 실행
pnpm test --run

# E2E 테스트: main 브랜치 머지 후 또는 release/* 브랜치에서만 실행
pnpm test:e2e
```

---

## 커버리지 리포트

```bash
pnpm test:coverage
# 결과: coverage/index.html 에서 확인
# 목표: Statements 60%, Branches 50%

# 커버리지 제외 대상 (측정 불필요)
# - app/**/page.tsx (E2E로 검증)
# - app/**/layout.tsx
# - types/index.ts
# - prisma/seed.ts
```