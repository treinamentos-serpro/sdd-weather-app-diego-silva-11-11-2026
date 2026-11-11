interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Carregando dados...' }: LoadingStateProps) {
  return (
    <div role="status" className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-100">
      {message}
    </div>
  );
}
