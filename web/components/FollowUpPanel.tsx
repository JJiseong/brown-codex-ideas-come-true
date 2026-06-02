export function FollowUpPanel({
  value,
  loading,
  onChange,
  onSubmit,
}: {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="follow-up-card" aria-label="추가 질문 답변">
      <div>
        <p className="eyebrow follow-up-eyebrow">Follow-up</p>
        <h2>추가 질문에 답변하기</h2>
        <p>
          결과가 질문으로 끝났다면 여기에 답변을 적고 이어서 생성하세요. 기존 입력과 질문 맥락을 함께
          보내서 다음 라운드를 진행합니다.
        </p>
      </div>
      <textarea
        className="follow-up-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="예: 사용자는 팀장과 PM이고, Slack에서 공유할 수 있으면 좋겠습니다. 성공 기준은 회의 후 5분 안에 담당자/마감일이 정리되는 것입니다."
        maxLength={10_000}
      />
      <div className="actions">
        <button className="primary" type="button" disabled={loading || value.trim().length < 2} onClick={onSubmit}>
          {loading ? "이어 생성 중..." : "답변 반영해서 이어 생성"}
        </button>
        <span className="helper">답변은 현재 결과와 합쳐져 같은 모드로 다시 전송됩니다.</span>
      </div>
    </section>
  );
}
