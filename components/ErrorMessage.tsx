export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm"
      data-testid="error-message"
    >
      {message}
    </div>
  );
}
