import { generateMarkdown, type GenerateMode } from "@/lib/generate";
import { loadPrompt } from "@/lib/loadPrompt";

const MAX_INPUT_LENGTH = 30_000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 20);

type Bucket = { count: number; resetAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __ideasComeTrueRateLimit: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__ideasComeTrueRateLimit ?? new Map<string, Bucket>();
globalThis.__ideasComeTrueRateLimit = buckets;

export async function handleGenerate(request: Request, mode: GenerateMode): Promise<Response> {
  try {
    const rateLimit = checkRateLimit(clientKey(request));
    if (!rateLimit.allowed) {
      return Response.json(
        { error: `요청이 너무 많습니다. ${rateLimit.retryAfterMinutes}분 후 다시 시도하세요.` },
        { status: 429 },
      );
    }

    let body: { input?: unknown };
    try {
      body = (await request.json()) as { input?: unknown };
    } catch {
      return Response.json({ error: "JSON 요청 본문이 올바르지 않습니다." }, { status: 400 });
    }

    const input = typeof body.input === "string" ? body.input.trim() : "";

    if (input.length < 5) {
      return Response.json({ error: "입력은 최소 5자 이상이어야 합니다." }, { status: 400 });
    }

    if (input.length > MAX_INPUT_LENGTH) {
      return Response.json(
        { error: `입력이 너무 깁니다. 최대 ${MAX_INPUT_LENGTH.toLocaleString()}자까지 지원합니다.` },
        { status: 400 },
      );
    }

    const prompt = await loadPrompt(mode);
    const markdown = await generateMarkdown({ systemPrompt: prompt, userInput: input, mode });

    return Response.json({ markdown });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const safeMessage = message.includes("OPENAI_API_KEY")
      ? "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다. 관리자에게 문의하세요."
      : message.includes("timed out")
        ? "모델 응답 시간이 초과되었습니다. 입력을 줄이거나 잠시 후 다시 시도하세요."
        : "생성 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.";

    console.error(`[${mode}] generation failed:`, message.replace(/[\r\n]+/g, " ").slice(0, 800));
    return Response.json({ error: safeMessage }, { status: 500 });
  }
}

function clientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

function checkRateLimit(key: string): { allowed: true } | { allowed: false; retryAfterMinutes: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    const retryAfterMinutes = Math.max(1, Math.ceil((existing.resetAt - now) / 60_000));
    return { allowed: false, retryAfterMinutes };
  }

  existing.count += 1;
  return { allowed: true };
}
