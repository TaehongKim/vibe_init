@.claude/skills/token-optimization.md

# CLAUDE.md

> 세션 시작 시 이 파일을 먼저 읽고 필요한 rules/ 파일만 추가로 로드할 것.

---

## 프로젝트 문서

- `prd.md` — 기능 요구사항 (기능 구현 전 확인)
- `plan.md` — 디렉토리 구조, 주차별 계획, 컴포넌트 의존성 순서
- `progress.md` — 현재 진행 상황, 완료/미완료 체크리스트

---

## 세 역할 팀 (기획자·개발자·검토자)

| 역할 | 역할 파일 | 담당 |
|------|----------|------|
| **기획자** | `ARCHITECT.md` | 설계·브리핑·배포 게이트 |
| **개발자** | `BUILDER.md` | 요구사항 구현 |
| **검토자** | `REVIEWER.md` | 코드 품질·보안 검증 |

**워크플로우**: 계획(기획자) → 구현(개발자) → 검증(검토자) → 배포(기획자)

세션 시작:
```
이 프로젝트의 기획자 역할입니다. .claude/CLAUDE.md를 읽은 후 ARCHITECT.md를 읽어주세요.
```

> 에이전트 모델: 기획자 `claude-opus-4-7` / 개발자 `claude-sonnet-4-6` / 검토자 `claude-haiku-4-5-20251001`

---

## 상세 규칙 (필요 시 로드)

- `@.claude/rules/stack.md` — 기술 스택, 디렉토리, 테스트, 명령어
- `@.claude/rules/coding.md` — 코딩 규칙, 에러 처리, Prisma, 인증
- `@.claude/rules/workflow.md` — 작업 방식, 세션 보고, 커뮤니케이션 형식 **(한국어 대화 필수)**
- `@.claude/rules/mcp-tools.md` — MCP 도구 상세 (Context7, Memory, Serena, Playwright)
- `@.claude/rules/security.md` — 보안 체크리스트
- `@.claude/rules/testing.md` — 테스트 작성 기준
