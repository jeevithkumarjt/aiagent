# aiagent — public prototype for the Sensiple AI Agent

A self-contained, static prototype of the Sensiple AI Agent, published with
GitHub Pages. It demonstrates the operator dashboard and the customer chat
using fixed sample data.

## Live URLs

- Landing (redirects to the agent): https://jeevithkumarjt.github.io/aiagent/
- Agent (dashboard + assistant): https://jeevithkumarjt.github.io/aiagent/agent/
- Chat: https://jeevithkumarjt.github.io/aiagent/agent/chat/

## This is a prototype

Everything you see is **sample data baked into the static files**. The chat
answers from a fixed script and the dashboard shows fixed figures. The pages
make **no network requests at all**, so nothing here can reach the real
deployment, the real knowledge base or the real model key, and there is nothing
to abuse or spam.

The full platform — crawler, vector index, retrieval, LLM, operator controls —
runs on a private deployment. Its source lives in the private
`sensiple-ai-agent` repository; **none of that source or data is in this
repository**.

## What is here

`agent/` contains only the built static files. GitHub Pages serves them; it
runs no server code.

`.nojekyll` is required: without it GitHub Pages runs Jekyll, which ignores
directories beginning with an underscore — and every asset here lives in
`_next/`.

## Rebuilding

The source lives in the private `sensiple-ai-agent` repository, under
`frontend/`. Build the prototype bundle with:

    NEXT_PUBLIC_BASE_PATH=/aiagent/agent \
    NEXT_PUBLIC_AUTO_GUEST=1 \
    NEXT_PUBLIC_DEMO=1 \
    NEXT_STATIC_EXPORT=1 \
    npm run build

`NEXT_PUBLIC_DEMO=1` is what makes this a prototype: `lib/api.ts` answers from
`lib/demo.ts` instead of calling the API, and the home page renders the sample
dashboard. Leave that variable unset and the same source builds the real,
backend-connected application.

Then copy `frontend/out/*` into `agent/` here and commit.
