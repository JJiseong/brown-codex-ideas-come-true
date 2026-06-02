# brown-codex-ideas-come-true

Claude Code 플러그인 `brown-claude-marketplace / ideas-come-true`를 Codex CLI 전용 워크플로우로 포팅한 버전입니다.

회사에서 Claude Code 또는 Claude 플러그인을 사용할 수 없고 Codex CLI만 허용되는 환경을 전제로 합니다.

## 포함 기능

- `codex-sharpen`
  - 모호한 아이디어를 제품 명세서로 다듬습니다.
- `codex-productify`
  - 명세서나 아이디어를 받아 제품 형태와 페이즈별 로드맵을 만듭니다.

## 원본 Claude 버전과의 차이

| Claude Code 버전 | Codex CLI 포팅 버전 |
|---|---|
| `/plugin marketplace add ...` | git clone 또는 로컬 디렉토리 사용 |
| `/plugin install ideas-come-true...` | `bin/` 스크립트 PATH 추가 |
| `/sharpen` | `codex-sharpen` |
| `/productify` | `codex-productify` |
| Claude Agent | 프롬프트 내부 Judge 단계 |
| Claude MCP tool 이름 | Codex MCP 또는 별도 CLI/API로 대체 가능 |
| Notion 저장 | 기본은 로컬 Markdown 저장 |

## 요구사항

- Codex CLI
- Node/npm 환경
- Codex 로그인 또는 OpenAI API 키
- git 저장소 환경

설치 예:

```bash
npm install -g @openai/codex
codex login
```

## 설치

권장 설치:

```bash
git clone https://github.com/JJiseong/brown-codex-ideas-come-true.git
cd brown-codex-ideas-come-true
./install.sh
```

설치 후 어디서든 실행할 수 있습니다.

```bash
codex-sharpen "슬랙에서 매일 팀 업무 상황을 자동 정리해주는 도구"
codex-productify outputs/<생성된-명세서>.md
```

옵션:

```bash
./install.sh --force          # 기존 설치 덮어쓰기
./install.sh --add-path       # ~/.local/bin을 shell rc에 자동 추가
./install.sh --install-codex  # codex CLI가 없으면 npm으로 설치
./install.sh --uninstall      # 설치 제거
```

수동 실행도 가능합니다.

## 사용법

현재 디렉토리에서 실행:

```bash
chmod +x bin/*
./bin/codex-sharpen "슬랙에서 매일 팀 업무 상황을 자동 정리해주는 도구"
```

파일 입력:

```bash
./bin/codex-sharpen examples/sample-idea.md
```

명세서를 제품화:

```bash
./bin/codex-productify outputs/my-idea-sharpened-spec.md
```

파이프 입력:

```bash
cat examples/sample-idea.md | ./bin/codex-sharpen
```

대화형으로 진행:

```bash
./bin/codex-sharpen --interactive examples/sample-idea.md
./bin/codex-productify --interactive outputs/my-idea-sharpened-spec.md
```

## 산출물

기본적으로 `outputs/` 아래에 저장됩니다.

- `outputs/{slug}-sharpened-spec.md`
- `outputs/{slug}-product-roadmap.md`

## 추천 워크플로우

```bash
./bin/codex-sharpen examples/sample-idea.md
./bin/codex-productify outputs/<생성된-명세서>.md
```

## Notion/Slack/Google 연동

MVP 포팅 버전은 외부 서비스 직접 저장을 제거하고 로컬 Markdown 저장만 지원합니다.

필요하면 다음 방식으로 확장하세요.

1. `codex mcp`로 Notion MCP 서버 연결
2. Notion API를 쓰는 별도 Python/Node 스크립트 추가
3. Google Drive/Docs CLI 또는 API wrapper 추가
4. 사내 보안 정책에 따라 API 키는 환경변수 또는 시크릿 매니저로 관리

## 보안 원칙

- API 키 없이 가능한 해결책을 먼저 선택합니다.
- 프로덕션 DB에 AI 도구가 직접 접근하지 않게 합니다.
- 개인정보, 결제, 의료, 인증 토큰은 외부 LLM으로 보내지 않습니다.
- 필요한 경우 최소 권한 read-only부터 검토합니다.

## 원본 저장소

- https://github.com/kimyoon21/brown-claude-marketplace
