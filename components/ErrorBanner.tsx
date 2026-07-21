import { AlertIcon } from "./icons";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex animate-fade-in items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-red-400" />
      <p>{message}</p>
    </div>
  );
}
