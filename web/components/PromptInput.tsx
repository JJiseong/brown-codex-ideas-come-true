export function PromptInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label>
      <div className="input-label">
        <span>입력</span>
        <span className="counter">{value.length.toLocaleString()} / 30,000자</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={30_000}
      />
    </label>
  );
}
