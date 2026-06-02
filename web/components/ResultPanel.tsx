import type { Mode } from "@/components/types";

export function ResultPanel({
  markdown,
  mode,
  onUseInProductify,
}: {
  markdown: string;
  mode: Mode;
  onUseInProductify: () => void;
}) {
  async function copyResult() {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      window.prompt("복사에 실패했습니다. 아래 내용을 직접 복사하세요.", markdown);
    }
  }

  function downloadResult() {
    const prefix = mode === "sharpen" ? "sharpened-spec" : "product-roadmap";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="result-card" aria-live="polite">
      <div className="result-header">
        <h2>생성 결과</h2>
        <div className="result-actions">
          {mode === "sharpen" ? (
            <button className="secondary" type="button" onClick={onUseInProductify}>
              Productify로 이어서 사용
            </button>
          ) : null}
          <button className="secondary" type="button" onClick={copyResult}>
            복사
          </button>
          <button className="secondary" type="button" onClick={downloadResult}>
            Markdown 다운로드
          </button>
        </div>
      </div>
      <pre className="result-body">{markdown}</pre>
    </section>
  );
}
