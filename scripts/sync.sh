#!/bin/bash
# Sync VPS data to Convex

CONVEX_SITE="https://tacit-mole-211.convex.site"
WORKSPACE="/home/ubuntu/clawd"
OPENCLAW_DIR="$HOME/.openclaw"

echo "=== Syncing Cron Jobs ==="

# Build cron jobs JSON
CRON_DIR="$OPENCLAW_DIR/cron/jobs"
if [ -d "$CRON_DIR" ]; then
  JOBS="["
  FIRST=true
  for f in "$CRON_DIR"/*.json; do
    [ -f "$f" ] || continue
    
    # Extract fields using jq
    JOB_ID=$(jq -r '.id // empty' "$f")
    NAME=$(jq -r '.name // "Unnamed"' "$f")
    ENABLED=$(jq -r '.enabled // true' "$f")
    SCHEDULE=$(jq -r '.schedule.expr // .schedule.kind // "unknown"' "$f")
    TZ=$(jq -r '.schedule.tz // empty' "$f")
    NEXT_RUN=$(jq -r '.state.nextRunAtMs // 0' "$f")
    LAST_RUN=$(jq -r '.state.lastRunAtMs // null' "$f")
    DESC=$(jq -r '(.payload.message // .payload.text // "No description") | .[0:200]' "$f")
    
    [ -z "$JOB_ID" ] && continue
    [ "$ENABLED" != "true" ] && continue
    
    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      JOBS="$JOBS,"
    fi
    
    JOBS="$JOBS{\"jobId\":\"$JOB_ID\",\"name\":\"$NAME\",\"enabled\":true,\"schedule\":\"$SCHEDULE\""
    [ -n "$TZ" ] && JOBS="$JOBS,\"timezone\":\"$TZ\""
    JOBS="$JOBS,\"nextRunAt\":$NEXT_RUN"
    [ "$LAST_RUN" != "null" ] && JOBS="$JOBS,\"lastRunAt\":$LAST_RUN"
    JOBS="$JOBS,\"description\":$(echo "$DESC" | jq -Rs .)}"
  done
  JOBS="$JOBS]"
  
  echo "Syncing $(echo "$JOBS" | jq length) cron jobs..."
  curl -s -X POST "$CONVEX_SITE/sync/cron" \
    -H "Content-Type: application/json" \
    -d "{\"jobs\":$JOBS}"
  echo ""
else
  echo "No cron directory found"
fi

echo ""
echo "=== Syncing Search Index ==="

DOCS="["
FIRST=true

# Index memory files
for f in "$WORKSPACE"/memory/*.md; do
  [ -f "$f" ] || continue
  TITLE=$(basename "$f")
  PATH_REL="memory/$TITLE"
  CONTENT=$(cat "$f" | head -c 5000)
  SNIPPET=$(echo "$CONTENT" | head -c 200)
  
  if [ "$FIRST" = true ]; then FIRST=false; else DOCS="$DOCS,"; fi
  DOCS="$DOCS{\"path\":\"$PATH_REL\",\"type\":\"memory\",\"title\":\"$TITLE\",\"content\":$(echo "$CONTENT" | jq -Rs .),\"snippet\":$(echo "$SNIPPET..." | jq -Rs .)}"
done

# Index MEMORY.md
if [ -f "$WORKSPACE/MEMORY.md" ]; then
  CONTENT=$(cat "$WORKSPACE/MEMORY.md" | head -c 5000)
  SNIPPET=$(echo "$CONTENT" | head -c 200)
  if [ "$FIRST" = true ]; then FIRST=false; else DOCS="$DOCS,"; fi
  DOCS="$DOCS{\"path\":\"MEMORY.md\",\"type\":\"memory\",\"title\":\"MEMORY.md\",\"content\":$(echo "$CONTENT" | jq -Rs .),\"snippet\":$(echo "$SNIPPET..." | jq -Rs .)}"
fi

# Index key docs
for f in "$WORKSPACE"/*.md "$WORKSPACE"/*/*.md; do
  [ -f "$f" ] || continue
  [[ "$f" == *"/node_modules/"* ]] && continue
  [[ "$f" == *"/memory/"* ]] && continue
  [[ "$f" == *"MEMORY.md" ]] && continue
  
  TITLE=$(basename "$f")
  PATH_REL="${f#$WORKSPACE/}"
  CONTENT=$(cat "$f" | head -c 5000)
  SNIPPET=$(echo "$CONTENT" | head -c 200)
  
  if [ "$FIRST" = true ]; then FIRST=false; else DOCS="$DOCS,"; fi
  DOCS="$DOCS{\"path\":\"$PATH_REL\",\"type\":\"document\",\"title\":\"$TITLE\",\"content\":$(echo "$CONTENT" | jq -Rs .),\"snippet\":$(echo "$SNIPPET..." | jq -Rs .)}"
done

DOCS="$DOCS]"

DOC_COUNT=$(echo "$DOCS" | jq length)
echo "Syncing $DOC_COUNT documents..."
curl -s -X POST "$CONVEX_SITE/sync/search" \
  -H "Content-Type: application/json" \
  -d "{\"documents\":$DOCS}"
echo ""

echo ""
echo "=== Sync Complete ==="
