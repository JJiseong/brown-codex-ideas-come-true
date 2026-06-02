export type GenerateMode = "sharpen" | "productify";

const WEB_SERVICE_RULES = [
  "You are running inside a stateless browser web service, not a CLI.",
  "Do not write files, call shell commands, or claim that any file was saved.",
  "Return Markdown content directly for the browser result panel.",
  "If the original prompt template asks for a saved file path or CLI next step, adapt it to browser actions: copy, download Markdown, or continue to Productify in the web UI.",
  "Do not mention Claude Code, Claude plugin marketplace, Claude Agent, or Claude-only MCP tool names as available features.",
  "If information is insufficient, return only 1-2 concise clarifying questions.",
].join("\n");

export async function generateMarkdown(params: {
  systemPrompt: string;
  userInput: string;
  mode: GenerateMode;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const endpoint = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 45_000);
  const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 4_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_output_tokens: maxOutputTokens,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [params.systemPrompt, "", "## Web Service Override", WEB_SERVICE_RULES].join("\n"),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Mode: ${params.mode}`,
                  "Audience: non-developer business user using a web browser",
                  "Output language: Korean unless the input clearly requests another language",
                  "Return plain Markdown or concise clarifying questions only.",
                  "",
                  params.userInput,
                ].join("\n"),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${body.slice(0, 600)}`);
    }

    const data = await response.json();
    if (typeof data.output_text === "string") {
      return data.output_text;
    }

    const text = extractOutputText(data);
    if (text) {
      return text;
    }

    return JSON.stringify(data, null, 2);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("OpenAI request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const maybeOutput = (data as { output?: unknown }).output;
  if (!Array.isArray(maybeOutput)) return "";

  const chunks: string[] = [];
  for (const item of maybeOutput) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") chunks.push(text);
    }
  }
  return chunks.join("\n").trim();
}
