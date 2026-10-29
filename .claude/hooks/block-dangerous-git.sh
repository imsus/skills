#!/bin/bash
# PreToolUse(Bash): block destructive git commands. Customized from
# mattpocock/skills git-guardrails-claude-code by /imsus-setup:
# - push is allowed to feature branches; force-push and push to main/master are not
# - reset --hard is allowed inside a .claude/worktrees/ worktree, where agents start with it
# - only a git command in command position counts, so a blocked command quoted as
#   data (a commit message, test cases) passes; sh -c and heredocs fed to a shell are scanned

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
CWD=$(echo "$INPUT" | jq -r '.cwd // "."')

# Heredoc bodies are data (a commit message, a file's contents) unless the heredoc
# feeds a shell (`bash <<'EOF'`): drop the data ones. Same awk as
# ~/.claude/hooks/guard-git-commit.sh, plus the shell case.
BODY=$(awk '
  delim != "" {
    line = $0
    if (strip) sub(/^\t+/, "", line)
    if (line == delim) { delim = ""; next }
    if (feeds) print
    next
  }
  { print }
  match($0, /<<-?[ \t]*["\047]?[A-Za-z_][A-Za-z0-9_]*["\047]?/) {
    tag = substr($0, RSTART, RLENGTH)
    feeds = (substr($0, 1, RSTART - 1) ~ /(^|[^A-Za-z0-9_])(ba|z)?sh([ \t]+-[A-Za-z]+)*[ \t]*$/)
    strip = (tag ~ /^<<-/)
    gsub(/^<<-?[ \t]*|["\047]/, "", tag)
    delim = tag
  }' <<<"$COMMAND")

# One simple command per line, kept only when it is a git command: unwrap sh -c,
# drop quote characters (keeping the text they quote), break at ; & | ( and
# shell keywords, and fold `git -C <dir>` / `git -c <k=v>` into plain `git`.
SCAN=$(printf '%s\n' "$BODY" \
  | perl -pe 's/(^|[^A-Za-z0-9_])(ba|z)?sh( +-[A-Za-z]+)* +-c +/$1\n/g' \
  | tr -d "\"'" \
  | perl -pe 's/(&&|\|\||[;&|(`]|\$\()/\n/g; s/(^|\s)(then|do|else|if|while|until|exec|time)\s/\n/g' \
  | perl -pe 's/^\s+//; s/^git( +-[Cc] +\S+)*/git/' \
  | grep -E '^git( |$)')

block() {
  echo "BLOCKED: '$COMMAND' $1. The user has prevented you from doing this." >&2
  exit 2
}

DANGEROUS_PATTERNS=(
  "git clean -fd"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$SCAN" | grep -qE "$pattern"; then
    block "matches dangerous pattern '$pattern'"
  fi
done

if echo "$SCAN" | grep -qE "reset --hard"; then
  case "$CWD" in
    */.claude/worktrees/*) ;;
    *) block "runs reset --hard outside a .claude/worktrees/ worktree" ;;
  esac
fi

if echo "$SCAN" | grep -qE "git push"; then
  if echo "$SCAN" | grep -qE -- "--force|--force-with-lease|push( [^ ]+)* -f( |$)|push( [^ ]+)* \+"; then
    block "force-pushes"
  fi
  if echo "$SCAN" | grep -qE "push( [^ ]+)* ([^ ]*:)?(main|master)( |$)"; then
    block "pushes to main"
  fi
  BRANCH=$(git -C "$CWD" symbolic-ref --short HEAD 2>/dev/null)
  if ! echo "$SCAN" | grep -qE "git push +[^ -][^ ]* +[^ -]" && { [ "$BRANCH" = main ] || [ "$BRANCH" = master ]; }; then
    block "pushes from $BRANCH without naming a feature branch"
  fi
fi

exit 0
