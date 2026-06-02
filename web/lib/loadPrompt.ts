import { PRODUCTIFY_PROMPT, SHARPEN_PROMPT } from "@/lib/promptText";

export type PromptKind = "sharpen" | "productify";

export async function loadPrompt(kind: PromptKind): Promise<string> {
  return kind === "sharpen" ? SHARPEN_PROMPT : PRODUCTIFY_PROMPT;
}
