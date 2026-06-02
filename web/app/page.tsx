"use client";

import { FormEvent, useMemo, useState } from "react";
import { FollowUpPanel, type FollowUpQuestion } from "@/components/FollowUpPanel";
import { LoadingButton } from "@/components/LoadingButton";
import { ModeSelector } from "@/components/ModeSelector";
import { PromptInput } from "@/components/PromptInput";
import { ResultPanel } from "@/components/ResultPanel";
import type { Mode } from "@/components/types";

const PLACEHOLDERS: Record<Mode, string> = {
  sharpen:
    "예: 우리 팀은 회의 후 액션아이템이 흩어져서 추적이 어렵습니다. 비개발자도 쓸 수 있는 간단한 도구로 회의 내용을 정리하고 담당자/마감일을 뽑고 싶어요.",
  productify:
    "예: sharpen으로 만든 명세서 또는 제품화하고 싶은 아이디어를 붙여넣으세요. 사용 대상, 환경, 제약, 연동 요구가 있으면 함께 적어주세요.",
};

type GenerateRequest = {
  input: string;
  mode: Mode;
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("sharpen");
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [error, setError] = useState("");

  const actionText = useMemo(() => {
    return mode === "sharpen" ? "명세서 생성" : "제품화 로드맵 생성";
  }, [mode]);

  const followUpQuestions = useMemo(() => extractQuestions(result), [result]);

  async function generate({ input: requestInput, mode: requestMode }: GenerateRequest): Promise<string> {
    const response = await fetch(`/api/${requestMode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: requestInput }),
    });
    const data = (await response.json()) as { markdown?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "요청에 실패했습니다.");
    }
    return data.markdown || "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 5) {
      setError("아이디어나 명세를 5자 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setFollowUpAnswers({});

    try {
      setResult(await generate({ input: trimmed, mode }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function submitFollowUp() {
    const answeredPairs = followUpQuestions
      .map((question, index) => ({
        label: `질문 ${index + 1}`,
        question: question.text,
        answer: (followUpAnswers[question.id] || "").trim(),
      }))
      .filter((item) => item.answer.length > 1);

    if (answeredPairs.length === 0 || !result) {
      setError("추가 질문 중 하나 이상에 답변해주세요.");
      return;
    }

    const combinedInput = [
      "아래는 사용자가 처음 입력한 내용, 직전 모델 응답, 그리고 질문별 추가 답변입니다.",
      "직전 모델 응답이 질문이었다면 추가 답변을 반영해 다음 라운드를 진행하세요.",
      "정보가 충분해졌다면 질문을 반복하지 말고 최종 Markdown 결과를 작성하세요.",
      "",
      "## 처음 입력",
      input.trim(),
      "",
      "## 직전 모델 응답",
      result,
      "",
      "## 사용자의 질문별 추가 답변",
      ...answeredPairs.flatMap((item) => [
        `### ${item.label}`,
        item.question,
        "",
        "답변:",
        item.answer,
        "",
      ]),
    ].join("\n");

    setFollowUpLoading(true);
    setError("");

    try {
      const nextResult = await generate({ input: combinedInput, mode });
      setInput(combinedInput);
      setResult(nextResult);
      setFollowUpAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setFollowUpLoading(false);
    }
  }

  function updateFollowUpAnswer(questionId: string, value: string) {
    setFollowUpAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function useResultInProductify() {
    setMode("productify");
    setInput(result);
    setResult("");
    setFollowUpAnswers({});
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setResult("");
    setFollowUpAnswers({});
    setError("");
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">Ideas Come True · Web MVP</p>
          <h1>아이디어를 명세서와 로드맵으로</h1>
          <p>
            터미널을 모르는 동료도 브라우저에서 아이디어를 다듬고 제품화 방향을 잡을 수 있습니다.
            Claude 없이 Codex/OpenAI-compatible 환경을 전제로 동작합니다.
          </p>
        </div>
        <aside className="notice" aria-label="데이터 입력 주의사항">
          <h2>입력 전 주의</h2>
          <ul>
            <li>개인정보, 고객 데이터, 결제/의료 정보는 입력하지 마세요.</li>
            <li>인증 토큰, 비밀번호, API 키를 붙여넣지 마세요.</li>
            <li>입력 내용은 결과 생성을 위해 회사가 설정한 모델 API로 전송됩니다.</li>
            <li>이 MVP는 입력/출력을 데이터베이스에 저장하지 않습니다.</li>
          </ul>
        </aside>
      </section>

      <form className="workspace" onSubmit={submit}>
        <ModeSelector value={mode} onChange={changeMode} />
        <PromptInput value={input} onChange={setInput} placeholder={PLACEHOLDERS[mode]} />
        <div className="actions">
          <LoadingButton loading={loading}>{actionText}</LoadingButton>
          <button className="secondary" type="button" onClick={() => setInput(PLACEHOLDERS[mode])}>
            예시 채우기
          </button>
          <span className="helper">결과가 부족하면 1–2개의 보강 질문을 먼저 반환합니다.</span>
        </div>
        {error ? <div className="error">{error}</div> : null}
      </form>

      {result ? (
        <>
          <ResultPanel markdown={result} mode={mode} onUseInProductify={useResultInProductify} />
          {followUpQuestions.length > 0 ? (
            <FollowUpPanel
              questions={followUpQuestions}
              answers={followUpAnswers}
              loading={followUpLoading}
              onAnswerChange={updateFollowUpAnswer}
              onSubmit={submitFollowUp}
            />
          ) : null}
        </>
      ) : null}

      <p className="footer">MVP: 로그인/DB/히스토리 없이 동작합니다. 운영 전 사내 데이터 정책을 확인하세요.</p>
    </main>
  );
}

function extractQuestions(markdown: string): FollowUpQuestion[] {
  if (!markdown.trim()) return [];

  const lines = markdown
    .split("\n")
    .map((line) => line.replace(/^[-*#>\s]+/, "").trim())
    .filter(Boolean);

  const questionLines = lines.filter((line) => {
    const normalized = line.replace(/^질문\s*\d+\s*[:.)-]?\s*/i, "").trim();
    return (
      /^질문\s*\d+/i.test(line) ||
      /^\d+\s*[.)]\s+/.test(line) ||
      normalized.endsWith("?") ||
      normalized.endsWith("？") ||
      normalized.includes("인가요") ||
      normalized.includes("무엇인가요") ||
      normalized.includes("알려주세요")
    );
  });

  const unique = Array.from(new Set(questionLines)).slice(0, 5);
  return unique.map((text, index) => ({ id: `q-${index}`, text }));
}
