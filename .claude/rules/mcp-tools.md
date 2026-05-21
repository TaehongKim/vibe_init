# MCP 도구 상세

> **설치·수정 규칙**: MCP 추가/변경 시 `.claude/settings.json`과 `.agents/settings.json` 두 파일을 반드시 동시에 수정할 것.

## Context7

라이브러리 최신 문서를 실시간으로 참조. 라이브러리 API 불확실 / 새 기능 구현 / 에러 해결 탐색 시 사용.

```
use context7 → get-library-docs("/vercel/next.js")
use context7 → get-library-docs("/prisma/prisma")
use context7 → get-library-docs("/nextauthjs/next-auth")
```

---

## Memory MCP (hot-memory-mcp)

| 명령 | 기능 |
|------|------|
| `/memory-mcp:remember` | 메모리 저장 |
| `/memory-mcp:recall` | 메모리 검색 |
| `/memory-mcp:bootstrap` | 프로젝트 문서에서 초기 시드 생성 |

---

## Serena (serena-agent)

심볼 수준의 코드 탐색·편집. 대형 코드베이스 추적 / 안전한 리팩토링 / 파일 아웃라인 파악 시 사용.

설치: `uv tool install -p 3.13 serena-agent --prerelease=allow`

> Serena 도구 준수 저하 시: `serena prompts print-cc-system-prompt-override`

---

## Playwright MCP

실제 브라우저 제어. E2E 테스트 플로우 검증 / 테스트 코드 자동 생성(`start_codegen_session` → 조작 → `end_codegen_session`) / 실패 시 스크린샷·로그 분석 시 사용.
