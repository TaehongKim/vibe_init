# 바이브 코딩 템플릿 (Vibe Coding Template)

Claude Code와 함께 사용하는 **세 역할 팀** 기반의 AI 협업 개발 템플릿입니다.  
기획자·개발자·검토자 세 에이전트가 한 세션 안에서 순서대로 협업하며 코드를 설계·구현·검증합니다.

---

## 이 템플릿이 하는 일

```
기획자 (Architect)  →  개발자 (Builder)  →  검토자 (Reviewer)  →  배포
     설계·브리핑            구현                품질·보안 검증         기획자 승인
```

- **기획자**: 요구사항을 분석하고 개발자에게 브리프를 작성합니다. 배포까지 책임집니다.
- **개발자**: 브리프에 따라 코드를 구현하고 검토 요청서를 작성합니다.
- **검토자**: 스펙 준수·보안·코드 품질을 검토하고 피드백을 작성합니다.

세 역할 모두 **하나의 Claude Code 세션**에서 실행됩니다. 창을 세 개 열 필요 없습니다.

---

## 디렉토리 구조

```
template/
├── ARCHITECT.md          # 기획자 역할 지침
├── BUILDER.md            # 개발자 역할 지침
├── REVIEWER.md           # 검토자 역할 지침
├── new-setup.md          # 최초 1회 초기 설정 안내
│
├── handoff/              # 역할 간 핸드오프 파일
│   ├── ARCHITECT-BRIEF.md    # 기획자 → 개발자 브리프
│   ├── REVIEW-REQUEST.md     # 개발자 → 검토자 검토 요청
│   ├── REVIEW-FEEDBACK.md    # 검토자 → 개발자 피드백
│   ├── BUILD-LOG.md          # 빌드 이력 (기획자 관리)
│   └── SESSION-CHECKPOINT.md # 세션 종료 시 체크포인트
│
├── .claude/
│   ├── CLAUDE.md             # 세션 라우터 (50줄 이하)
│   ├── settings.json         # MCP 서버 설정
│   ├── skills/
│   │   └── token-optimization.md  # 토큰 절약 규칙
│   └── rules/
│       ├── stack.md          # 기술 스택·디렉토리·명령어
│       ├── coding.md         # 코딩 규칙·에러 처리·Prisma·인증
│       ├── workflow.md       # 작업 방식·커뮤니케이션 형식
│       ├── mcp-tools.md      # MCP 도구 상세 가이드
│       ├── security.md       # 보안 체크리스트
│       └── testing.md        # 테스트 기준
│
└── .agents/
    ├── .agents.md            # @../.claude/CLAUDE.md 참조
    └── settings.json         # 에이전트용 MCP 설정 (동일)
```

---

## 기술 스택 (기본값)

이 템플릿은 아래 스택을 기본으로 설정되어 있습니다. 프로젝트에 맞게 수정하세요.

| 기술 | 용도 |
|------|------|
| Next.js 15 (App Router) | 풀스택 프레임워크 |
| TypeScript strict | 타입 안전성 |
| Tailwind CSS v4 | 스타일링 |
| Prisma ORM + PostgreSQL | 데이터베이스 |
| NextAuth v5 | 인증 |
| Zod | 입력값 검증 |
| SWR | 클라이언트 데이터 페칭 |
| Vitest + Playwright | 테스트 |

---

## 설치 및 초기 설정

### 1. 템플릿 복사

```bash
git clone <이 저장소> my-project
cd my-project
```

### 2. MCP 서버 설치

Claude Code에게 아래 프롬프트를 붙여넣으면 자동으로 설치합니다:

```
이 프로젝트의 MCP 서버를 설치해줘.
- Serena: uv tool install -p 3.13 serena-agent --prerelease=allow 실행 후 serena init
- Context7, Playwright MCP는 .claude/settings.json에 이미 설정되어 있으니 확인만 해줘
설치 완료 후 .claude/settings.json과 .agents/settings.json에 모두 등록됐는지 확인해줘.
```

### 3. API 키 설정

`settings.json`은 API 키를 포함하므로 `.gitignore`에 제외되어 있습니다.  
예시 파일을 복사해 실제 키를 채워넣으세요.

```bash
cp .claude/settings.example.json .claude/settings.json
cp .agents/settings.example.json .agents/settings.json
```

그 다음 두 파일에서 `your-context7-api-key-here`를 실제 키로 교체합니다.

**API 키 발급 위치**

| MCP | 발급 주소 | 비고 |
|-----|---------|------|
| Context7 | [context7.com](https://context7.com) | 무료 플랜 제공 |
| Memory MCP | 없음 | 로컬 전용, 키 불필요 |
| Serena | 없음 | 로컬 전용, 키 불필요 |
| Playwright | 없음 | 로컬 전용, 키 불필요 |

### 4. Claude Code에서 첫 세션 시작

Claude Code를 열고 아래 프롬프트로 시작합니다 **(최초 1회만)**:

```
이 프로젝트의 기획자 역할입니다. new-setup.md를 읽어주세요.
```

이후 매 세션은 아래 프롬프트를 사용합니다:

```
이 프로젝트의 기획자 역할입니다. .claude/CLAUDE.md를 읽은 후 ARCHITECT.md를 읽어주세요.
```

---

## 매 세션 사용 방법

1. Claude Code를 엽니다.
2. 위의 기획자 세션 시작 프롬프트를 붙여넣습니다.
3. 기획자가 현황을 파악하고 사용자와 한국어로 대화합니다.
4. 구현이 필요하면 기획자가 개발자(서브에이전트)를 자동으로 시작합니다.
5. 개발 완료 후 기획자가 검토자(서브에이전트)를 시작합니다.
6. 검토자 승인 후 기획자가 배포를 진행합니다.

---

## MCP 도구

| 도구 | 역할 |
|------|------|
| **Context7** | 라이브러리 공식 문서 실시간 조회 |
| **Memory MCP** | 세션 간 컨텍스트 영구 저장·검색 |
| **Serena** | 심볼 수준 코드 탐색·리팩토링 |
| **Playwright MCP** | E2E 테스트 자동화, 브라우저 제어 |

MCP 추가 시 `.claude/settings.json`과 `.agents/settings.json` **두 파일을 반드시 동시에 수정**합니다.

---

## 커스터마이징

- **프로젝트 개요**: `.claude/CLAUDE.md`에 프로젝트 설명 추가
- **기술 스택 변경**: `.claude/rules/stack.md` 수정
- **코딩 규칙 변경**: `.claude/rules/coding.md` 수정
- **보안 규칙**: `.claude/rules/security.md` 참조
- **테스트 기준**: `.claude/rules/testing.md` 참조

---

## 라이선스

MIT
