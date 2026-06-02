# AGENTS.md — ideas-come-true for Codex CLI

이 저장소는 Claude Code 플러그인 `ideas-come-true`를 Codex CLI에서 사용할 수 있도록 포팅한 워크플로우 패키지다.

## 기본 원칙

- 대화 언어는 기본적으로 한국어를 사용한다.
- 사용자의 아이디어를 바로 구현하지 말고, 먼저 의도/범위/성공 기준을 명확히 한다.
- 가장 가벼운 제품 형태를 우선 검토한다.
- API 키, 외부 서버, DB, 민감 데이터 접근은 기본적으로 피한다.
- 파일을 생성할 때는 `outputs/` 아래에 Markdown으로 저장한다.
- 저장 전 디렉토리가 없으면 생성한다.
- 산출물에는 작성일, 입력 요약, 미확인 항목, 다음 액션을 포함한다.

## 워크플로우

1. `prompts/sharpen.md`
   - 모호한 아이디어를 제품화 가능한 명세서로 다듬는다.
2. `prompts/productify.md`
   - 명세서나 아이디어를 받아 제품 형태와 단계별 로드맵을 만든다.

## Codex 실행 시 주의

- Codex CLI는 git 저장소 안에서 실행하는 것이 안정적이다.
- wrapper 스크립트는 이 저장소 루트에서 `codex exec --full-auto -C <repo>`를 호출한다.
- Notion/Slack/Google 직접 연동은 기본 기능이 아니다. 필요하면 Codex MCP 또는 별도 CLI/API를 추가 구성한다.
