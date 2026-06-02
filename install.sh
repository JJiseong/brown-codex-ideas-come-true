#!/usr/bin/env bash
set -euo pipefail

APP_NAME="brown-codex-ideas-come-true"
PREFIX="${HOME}/.local"
FORCE=0
ADD_PATH=0
INSTALL_CODEX=0
UNINSTALL=0

usage() {
  cat <<'EOF'
사용법:
  ./install.sh [옵션]

옵션:
  --prefix DIR       설치 prefix. 기본값: ~/.local
  --force            기존 설치를 덮어쓰기
  --add-path         ~/.local/bin을 shell rc에 자동 추가
  --install-codex    codex CLI가 없으면 npm으로 설치
  --uninstall        설치 제거
  -h, --help         도움말

설치 후 명령어:
  codex-sharpen "내 아이디어"
  codex-productify outputs/<spec>.md
EOF
}

log() {
  printf '%s\n' "$*"
}

fail() {
  printf '오류: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)
      [[ $# -ge 2 ]] || fail "--prefix에는 경로가 필요합니다."
      PREFIX="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --add-path)
      ADD_PATH=1
      shift
      ;;
    --install-codex)
      INSTALL_CODEX=1
      shift
      ;;
    --uninstall)
      UNINSTALL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "알 수 없는 옵션: $1"
      ;;
  esac
done

# Expand a leading ~ if the user passed --prefix ~/.local-like paths.
case "$PREFIX" in
  '~') PREFIX="$HOME" ;;
  '~/'*) PREFIX="$HOME/${PREFIX#~/}" ;;
esac

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$PREFIX/share/$APP_NAME"
BIN_DIR="$PREFIX/bin"

if [[ "$UNINSTALL" == "1" ]]; then
  log "설치 제거 중..."
  rm -f "$BIN_DIR/codex-sharpen" "$BIN_DIR/codex-productify"
  rm -rf "$INSTALL_DIR"
  log "제거 완료: $APP_NAME"
  exit 0
fi

[[ -f "$SRC_DIR/prompts/sharpen.md" ]] || fail "repo 루트에서 실행해야 합니다: prompts/sharpen.md 없음"
[[ -f "$SRC_DIR/prompts/productify.md" ]] || fail "repo 루트에서 실행해야 합니다: prompts/productify.md 없음"
[[ -f "$SRC_DIR/bin/codex-sharpen" ]] || fail "repo 루트에서 실행해야 합니다: bin/codex-sharpen 없음"
[[ -f "$SRC_DIR/bin/codex-productify" ]] || fail "repo 루트에서 실행해야 합니다: bin/codex-productify 없음"

if ! command -v codex >/dev/null 2>&1; then
  if [[ "$INSTALL_CODEX" == "1" ]]; then
    command -v npm >/dev/null 2>&1 || fail "npm이 없어 codex CLI를 설치할 수 없습니다. Node/npm을 먼저 설치하세요."
    log "codex CLI 설치 중: npm install -g @openai/codex"
    npm install -g @openai/codex
  else
    cat >&2 <<'EOF'
codex CLI를 찾을 수 없습니다.

먼저 설치/로그인하세요:
  npm install -g @openai/codex
  codex login

또는 installer에 --install-codex 옵션을 줄 수 있습니다:
  ./install.sh --install-codex
EOF
    exit 1
  fi
fi

if [[ -e "$INSTALL_DIR" && "$FORCE" != "1" ]]; then
  cat >&2 <<EOF
이미 설치되어 있습니다: $INSTALL_DIR
덮어쓰려면 --force 옵션을 사용하세요.
제거하려면 --uninstall 옵션을 사용하세요.
EOF
  exit 1
fi

log "설치 디렉토리 준비: $INSTALL_DIR"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR" "$BIN_DIR"

log "파일 복사 중..."
cp -R \
  "$SRC_DIR/AGENTS.md" \
  "$SRC_DIR/README.md" \
  "$SRC_DIR/prompts" \
  "$SRC_DIR/bin" \
  "$SRC_DIR/examples" \
  "$INSTALL_DIR/"
mkdir -p "$INSTALL_DIR/outputs"
: > "$INSTALL_DIR/outputs/.gitkeep"

chmod +x "$INSTALL_DIR/bin/codex-sharpen" "$INSTALL_DIR/bin/codex-productify"

log "실행 wrapper 생성 중: $BIN_DIR"
cat > "$BIN_DIR/codex-sharpen" <<EOF
#!/usr/bin/env bash
exec "$INSTALL_DIR/bin/codex-sharpen" "\$@"
EOF

cat > "$BIN_DIR/codex-productify" <<EOF
#!/usr/bin/env bash
exec "$INSTALL_DIR/bin/codex-productify" "\$@"
EOF

chmod +x "$BIN_DIR/codex-sharpen" "$BIN_DIR/codex-productify"

if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  log ""
  log "주의: $BIN_DIR 이 현재 PATH에 없습니다."
  log "다음을 shell 설정에 추가하세요:"
  log "  export PATH=\"$BIN_DIR:\$PATH\""

  if [[ "$ADD_PATH" == "1" ]]; then
    SHELL_NAME="$(basename "${SHELL:-bash}")"
    case "$SHELL_NAME" in
      zsh) SHELL_RC="$HOME/.zshrc" ;;
      bash) SHELL_RC="$HOME/.bashrc" ;;
      *) SHELL_RC="$HOME/.profile" ;;
    esac
    touch "$SHELL_RC"
    if ! grep -Fq "$BIN_DIR" "$SHELL_RC"; then
      {
        echo ""
        echo "# brown-codex-ideas-come-true"
        echo "export PATH=\"$BIN_DIR:\$PATH\""
      } >> "$SHELL_RC"
      log "PATH 설정을 추가했습니다: $SHELL_RC"
      log "현재 터미널에 적용하려면 실행: source $SHELL_RC"
    else
      log "PATH 설정이 이미 존재합니다: $SHELL_RC"
    fi
  fi
fi

log ""
log "검증 중..."
"$BIN_DIR/codex-sharpen" --help >/dev/null
"$BIN_DIR/codex-productify" --help >/dev/null
CODEX_VERSION="$(codex --version 2>/dev/null || true)"

log ""
log "설치 완료"
log "  앱 위치: $INSTALL_DIR"
log "  명령어: $BIN_DIR/codex-sharpen"
log "  명령어: $BIN_DIR/codex-productify"
[[ -n "$CODEX_VERSION" ]] && log "  Codex: $CODEX_VERSION"
log ""
log "사용 예:"
log "  codex-sharpen \"내 아이디어\""
log "  codex-productify outputs/<spec>.md"
