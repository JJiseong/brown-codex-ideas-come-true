export type FollowUpQuestion = {
  id: string;
  text: string;
};

export function FollowUpPanel({
  questions,
  answers,
  loading,
  onAnswerChange,
  onSubmit,
}: {
  questions: FollowUpQuestion[];
  answers: Record<string, string>;
  loading: boolean;
  onAnswerChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const hasAnyAnswer = Object.values(answers).some((answer) => answer.trim().length > 1);

  return (
    <section className="follow-up-card" aria-label="추가 질문 답변">
      <div>
        <p className="eyebrow follow-up-eyebrow">Follow-up</p>
        <h2>질문별로 답변하기</h2>
        <p>
          모델이 되물은 항목을 질문별 입력칸으로 나눴습니다. 모르는 항목은 비워두고 아는 항목만 답해도
          됩니다.
        </p>
      </div>

      <div className="question-list">
        {questions.map((question, index) => (
          <label className="question-item" key={question.id}>
            <span className="question-title">질문 {index + 1}</span>
            <span className="question-text">{question.text}</span>
            <textarea
              className="question-answer"
              value={answers[question.id] || ""}
              onChange={(event) => onAnswerChange(question.id, event.target.value)}
              placeholder="여기에 답변을 입력하세요. 모르면 비워둬도 됩니다."
              maxLength={5_000}
            />
          </label>
        ))}
      </div>

      <div className="actions">
        <button className="primary" type="button" disabled={loading || !hasAnyAnswer} onClick={onSubmit}>
          {loading ? "이어 생성 중..." : "답변 반영해서 이어 생성"}
        </button>
        <span className="helper">입력한 답변은 질문과 짝지어 같은 모드로 다시 전송됩니다.</span>
      </div>
    </section>
  );
}
