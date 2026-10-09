# aiagent — public chat for the Sensiple AI Agent

Static front end for the customer chat, published with GitHub Pages.

## Live URLs

- Landing (redirects to the assistant): https://jeevithkumarjt.github.io/aiagent/
- Agent: https://jeevithkumarjt.github.io/aiagent/agent/
- Chat: https://jeevithkumarjt.github.io/aiagent/agent/chat/

Every visitor is signed in as a guest automatically, so the chat is usable the
moment the page opens — there is no login screen.

## How it works

This repository contains **only the built static files** under `agent/`. GitHub
Pages serves them; it runs no server code.

The chat itself is not static. Answers come from the FastAPI backend that is
already deployed alongside the company site. The pages call that backend
directly at:

    https://www.sensiple.com/agent/api/v1/...

That cross-origin call is allowed because the backend lists this Pages origin
(`https://jeevithkumarjt.github.io`) in its `CORS_ORIGINS` setting.

`.nojekyll` is required: without it GitHub Pages runs Jekyll, which ignores
directories beginning with an underscore — and every asset here lives in
`_next/`.

## Abuse controls

Chat tokens are handed out without credentials, so the backend applies a
per-client-IP ceiling to `POST /api/v1/chat/stream` (a short burst limit plus a
daily budget). A throttled visitor sees a plain "question limit reached"
message rather than an error.

## Rebuilding

The source lives in the private `sensiple-ai-agent` repository, under
`frontend/`. Build the static bundle with:

    NEXT_PUBLIC_BASE_PATH=/aiagent/agent \
    NEXT_PUBLIC_API_BASE=https://www.sensiple.com/agent \
    NEXT_PUBLIC_AUTO_GUEST=1 \
    NEXT_STATIC_EXPORT=1 \
    npm run build

Then copy `frontend/out/*` into `agent/` here and commit.
