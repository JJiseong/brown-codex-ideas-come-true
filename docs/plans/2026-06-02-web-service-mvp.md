# Web Service MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the Codex CLI-only ideas-come-true workflow into a browser-based web service usable by non-developers.

**Architecture:** Build a lightweight Next.js web app that reuses the existing `prompts/sharpen.md` and `prompts/productify.md` as prompt templates. The first MVP is stateless: users paste an idea, generate a spec, then generate a roadmap, and download/copy Markdown. Server-side API routes call an OpenAI-compatible model using a server environment variable; no Claude dependency is introduced.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, OpenAI SDK or `fetch`, Markdown download, Vercel deployment.

---

## Product Decision

### Recommended product form

Use a **web-service**, but keep the first version as small as possible:

- Single web app URL for non-developers
- No login in MVP
- No database in MVP
- No Notion/Slack integration in MVP
- No file upload in MVP unless plain `.md/.txt` paste is not enough
- One server-side OpenAI API key controlled by the company
- Outputs are shown in browser and downloadable as Markdown

### Why CLI is not enough

The current package requires:

- terminal usage
- git clone
- script execution
- Codex CLI login
- local file paths

That is acceptable for developers but too much for normal business users.

### Why not run Codex CLI behind the web app?

Do **not** make the MVP run `codex exec` on the server for each request.

Reasons:

- Codex CLI is designed as an interactive/local coding agent, not a multi-tenant web backend.
- Server-side shell execution increases security risk.
- Per-user auth and sandboxing become complex.
- The current workflow is mostly prompt transformation, so direct model API calls are simpler.

The web service should reuse the **workflow and prompts**, not literally wrap the CLI process.

---

## MVP User Flow

1. User opens web app.
2. User selects mode:
   - Sharpen: idea → spec
   - Productify: spec/idea → roadmap
3. User pastes text.
4. User clicks Generate.
5. App returns:
   - If information is insufficient: 1–2 clarifying questions
   - If sufficient: Markdown output
6. User can:
   - copy result
   - download `.md`
   - continue from sharpen result into productify

---

## Security / Policy

### Required environment variable

```bash
OPENAI_API_KEY=...
```

Optional:

```bash
OPENAI_MODEL=gpt-5.5
```

### Data policy

Before production use, add a visible warning:

> Do not paste personal information, credentials, customer data, production DB exports, payment information, or medical data.

### MVP security grade

🟡 REVIEW

Reason:

- User-entered business text is sent to an external model provider.
- No PII detection exists in MVP.
- Company policy may require data handling review.

Mitigation:

- Add warning copy.
- Do not store inputs/outputs in DB.
- Do not log prompt bodies.
- Use server-side API key only.
- Add rate limiting before broader rollout.

---

## Proposed Directory Structure

```text
web/
  app/
    api/
      sharpen/
        route.ts
      productify/
        route.ts
    page.tsx
    layout.tsx
    globals.css
  components/
    ModeSelector.tsx
    PromptInput.tsx
    ResultPanel.tsx
    LoadingButton.tsx
  lib/
    loadPrompt.ts
    generate.ts
    slug.ts
  package.json
  next.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  .env.example
```

---

## Implementation Tasks

### Task 1: Create Next.js app skeleton

**Objective:** Add a `web/` directory with a minimal Next.js TypeScript app.

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.ts`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Create: `web/app/globals.css`
- Create: `web/.env.example`

**Step 1: Create package.json**

Use dependencies:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "latest",
    "openai": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest",
    "tailwindcss": "latest",
    "postcss": "latest",
    "autoprefixer": "latest"
  }
}
```

Use the official `openai` SDK package for typed client calls, or plain `fetch` if you want fewer dependencies.

**Step 2: Verify skeleton**

Run:

```bash
cd web
npm install
npm run build
```

Expected: build succeeds.

**Step 3: Commit**

```bash
git add web/
git commit -m "feat(web): add Next.js skeleton"
```

---

### Task 2: Add prompt loading utility

**Objective:** Reuse the root-level prompt files from the web backend.

**Files:**
- Create: `web/lib/loadPrompt.ts`

**Implementation:**

```ts
import { readFile } from "node:fs/promises";
import path from "node:path";

export type PromptKind = "sharpen" | "productify";

export async function loadPrompt(kind: PromptKind): Promise<string> {
  const filename = kind === "sharpen" ? "sharpen.md" : "productify.md";
  const promptPath = path.join(process.cwd(), "..", "prompts", filename);
  return readFile(promptPath, "utf8");
}
```

**Verification:**

Add a temporary API route or unit test later to confirm prompt text loads.

**Commit:**

```bash
git add web/lib/loadPrompt.ts
git commit -m "feat(web): load shared prompt templates"
```

---

### Task 3: Add model generation utility

**Objective:** Centralize OpenAI-compatible model calls.

**Files:**
- Create: `web/lib/generate.ts`

**Implementation shape:**

```ts
export async function generateMarkdown(params: {
  systemPrompt: string;
  userInput: string;
  mode: "sharpen" | "productify";
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: params.systemPrompt,
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Mode: ${params.mode}\n\n${params.userInput}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  return data.output_text ?? JSON.stringify(data);
}
```

**Verification:**

Run build:

```bash
cd web
npm run build
```

**Commit:**

```bash
git add web/lib/generate.ts
git commit -m "feat(web): add model generation utility"
```

---

### Task 4: Add API routes

**Objective:** Provide `/api/sharpen` and `/api/productify` endpoints.

**Files:**
- Create: `web/app/api/sharpen/route.ts`
- Create: `web/app/api/productify/route.ts`

**API contract:**

Request:

```json
{
  "input": "idea or spec text"
}
```

Response:

```json
{
  "markdown": "generated markdown or questions"
}
```

Validation:

- `input` is required
- min length: 5 characters
- max length: 30,000 characters for MVP

**Verification:**

Run dev server:

```bash
cd web
npm run dev
```

Test:

```bash
curl -X POST http://localhost:3000/api/sharpen \
  -H 'Content-Type: application/json' \
  -d '{"input":"팀 주간 업무를 정리하는 도구"}'
```

Expected: JSON response with `markdown`.

**Commit:**

```bash
git add web/app/api/
git commit -m "feat(web): add generation API routes"
```

---

### Task 5: Build single-page UI

**Objective:** Let non-developers use sharpen/productify from a browser.

**Files:**
- Modify: `web/app/page.tsx`
- Create: `web/components/ModeSelector.tsx`
- Create: `web/components/PromptInput.tsx`
- Create: `web/components/ResultPanel.tsx`
- Create: `web/components/LoadingButton.tsx`

**UI requirements:**

- Korean-first copy
- Clear mode selector
- Large textarea
- Generate button
- Loading state
- Error state
- Result preview
- Copy button
- Download Markdown button
- “Use this spec in Productify” button after sharpen

**Verification:**

Manual test in browser:

```bash
cd web
npm run dev
```

Expected:

- User can paste idea.
- Generate button calls correct API.
- Result appears.
- Copy works.
- Download works.

**Commit:**

```bash
git add web/app/page.tsx web/components/
git commit -m "feat(web): add browser UI"
```

---

### Task 6: Add safety copy and no-log policy

**Objective:** Make data handling expectations visible to business users.

**Files:**
- Modify: `web/app/page.tsx`
- Modify: `README.md`

**Add UI notice:**

```text
주의: 개인정보, 고객 데이터, 결제/의료 정보, 인증 토큰, 비밀번호를 입력하지 마세요.
입력 내용은 결과 생성을 위해 모델 API로 전송됩니다.
```

**README additions:**

- Web service deployment section
- Required env vars
- Data handling warning

**Commit:**

```bash
git add README.md web/app/page.tsx
git commit -m "docs: add web data handling notice"
```

---

### Task 7: Prepare Vercel deployment

**Objective:** Make it deployable with minimal setup.

**Files:**
- Create: `web/vercel.json` if needed
- Modify: `README.md`

**Vercel setup:**

```bash
cd web
vercel
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL
vercel --prod
```

**Environment variables:**

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
```

**Verification:**

- Production URL opens
- `/api/sharpen` works
- `/api/productify` works
- No prompt bodies appear in server logs

**Commit:**

```bash
git add README.md web/vercel.json
git commit -m "docs: add Vercel deployment guide"
```

---

## Later Phases

### Phase 2: Team readiness

- Add basic auth or company SSO
- Add rate limiting
- Add admin-configured model name
- Add result history only if company policy allows storage
- Add `.md` upload
- Add output templates

### Phase 3: Integrations

- Notion export
- Google Docs export
- Slack share link
- Workspace-specific prompt presets

### Phase 4: Governance

- PII detector before submission
- Audit logs without raw prompt bodies
- Cost dashboard
- Team usage analytics
- Approval flow for STOP/REVIEW outputs

---

## Immediate Recommendation

Build the MVP as a **stateless Next.js web app** first.

Do not start with:

- login
- database
- Notion integration
- Slack bot
- multi-tenant admin
- Codex CLI process execution on server

Those can come later after non-developer users validate that the browser workflow is useful.
