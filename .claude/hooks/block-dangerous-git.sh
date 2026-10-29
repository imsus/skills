#!/bin/bash
# PreToolUse(Bash): block destructive git commands. Customized from
# mattpocock/skills git-guardrails-claude-code by /imsus-setup:
# - push is allowed to feature branches; force-push and push to main/master are not
# - reset --hard is allowed inside a .claude/worktrees/ worktree, where agents start with it

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
CWD=$(echo "$INPUT" | jq -r '.cwd // "."')

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
  if echo "$COMMAND" | grep -qE "$pattern"; then
    block "matches dangerous pattern '$pattern'"
  fi
done

if echo "$COMMAND" | grep -qE "reset --hard"; then
  case "$CWD" in
    */.claude/worktrees/*) ;;
    *) block "runs reset --hard outside a .claude/worktrees/ worktree" ;;
  esac
fi

if echo "$COMMAND" | grep -qE "git push"; then
  if echo "$COMMAND" | grep -qE -- "--force|--force-with-lease|push( [^ ]+)* -f( |$)|push( [^ ]+)* \+"; then
    block "force-pushes"
  fi
  if echo "$COMMAND" | grep -qE "push( [^ ]+)* ([^ ]*:)?(main|master)( |$)"; then
    block "pushes to main"
  fi
  BRANCH=$(git -C "$CWD" symbolic-ref --short HEAD 2>/dev/null)
  if ! echo "$COMMAND" | grep -qE "git push +[^ -][^ ]* +[^ -]" && { [ "$BRANCH" = main ] || [ "$BRANCH" = master ]; }; then
    block "pushes from $BRANCH without naming a feature branch"
  fi
fi

exit 0
