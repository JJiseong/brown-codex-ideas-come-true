export function LoadingButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button className="primary" type="submit" disabled={loading}>
      {loading ? "생성 중..." : children}
    </button>
  );
}
