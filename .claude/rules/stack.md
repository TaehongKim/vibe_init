# 기술 스택 및 구조

## 기술 스택 (기본값 — 프로젝트에 맞게 변경 가능)

> 이 목록은 템플릿 기본값입니다. 변경 시 이 파일과 `coding.md`, `security.md`를 함께 수정하세요.

```
Next.js 15        App Router, TypeScript strict mode
Tailwind CSS v4   스타일링
Prisma ORM        PostgreSQL 연동
NextAuth v5       인증 (provider는 프로젝트에 맞게 변경)
Zod               입력값 검증
SWR               클라이언트 데이터 페칭
Vitest            단위 테스트
Playwright        E2E 테스트
```

스택 변경이 필요하면 먼저 사람에게 확인 후 진행할 것.

## 디렉토리 규칙

```
app/            라우트 파일만 (page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx)
components/     재사용 UI 컴포넌트 (도메인별 서브폴더)
lib/            외부 클라이언트 초기화, 유틸 함수
actions/        Server Actions (도메인별 파일로 분리)
types/          공통 TypeScript 타입 (index.ts)
```

새 파일 생성 전 `plan.md`의 디렉토리 구조를 먼저 확인할 것.

## 테스트 규칙

```
단위 테스트 : lib/, actions/ 함수 — Vitest
컴포넌트 테스트 : 주요 컴포넌트 — Testing Library
E2E 테스트  : 핵심 플로우 5개 — Playwright
커버리지 목표 : 60%
```

상세 규칙: `rules/testing.md` 참조

## 자주 쓰는 명령어

```bash
pnpm dev
pnpm prisma migrate dev --name [변경내용] && pnpm prisma generate
pnpm test && pnpm test:e2e
pnpm build && pnpm start
pm2 restart [프로젝트명]
```
