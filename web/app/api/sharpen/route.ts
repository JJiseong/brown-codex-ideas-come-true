import { handleGenerate } from "../_shared";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleGenerate(request, "sharpen");
}
