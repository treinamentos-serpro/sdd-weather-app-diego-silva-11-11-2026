import { type FormEvent, useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
  privacyMessage?: string;
}

export default function SearchBar({
  onSearch,
  disabled = false,
  privacyMessage = 'O nome da cidade será enviado ao Open-Meteo.',
}: SearchBarProps) {
  const [city, setCity] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputId = useId();
  const privacyId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setHasError(true);
      return;
    }

    setHasError(false);
    onSearch(trimmedCity);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-white/5 p-4 font-sans text-white shadow-glass backdrop-blur-md"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
        Nome da cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          type="search"
          value={city}
          required
          onChange={(event) => {
            setCity(event.target.value);
            setHasError(false);
          }}
          disabled={disabled}
          aria-required="true"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${privacyId} ${errorId}` : privacyId}
          className="min-w-0 flex-1 rounded-lg border border-white/20 bg-night-900/80 px-4 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-accent-500 px-5 py-3 font-semibold text-night-900 hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Buscar
        </button>
      </div>
      <p id={privacyId} className="mt-3 text-sm text-slate-200">
        {privacyMessage}
      </p>
      {hasError && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-200">
          Informe o nome da cidade.
        </p>
      )}
    </form>
  );
}
