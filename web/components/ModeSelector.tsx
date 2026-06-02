import type { Mode } from "@/components/types";

const MODES: Array<{ mode: Mode; title: string; description: string }> = [
  {
    mode: "sharpen",
    title: "Sharpen",
    description: "모호한 아이디어를 제품 명세서로 다듬습니다.",
  },
  {
    mode: "productify",
    title: "Productify",
    description: "명세서나 아이디어를 제품 형태와 로드맵으로 바꿉니다.",
  },
];

export function ModeSelector({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="mode-grid" role="tablist" aria-label="생성 모드 선택">
      {MODES.map((item) => (
        <button
          key={item.mode}
          type="button"
          className={`mode-button ${value === item.mode ? "active" : ""}`}
          onClick={() => onChange(item.mode)}
          aria-pressed={value === item.mode}
        >
          <strong>{item.title}</strong>
          <span>{item.description}</span>
        </button>
      ))}
    </div>
  );
}
