import {useState} from 'react';
import {Button} from '@/components/ui/button.tsx';

type PendingSession = {sessionId: string; revision: number; savedAt: string; documentCount: number};

export function RemotePendingSessions({sessions, message, recover, continueCurrent}: {
  sessions: PendingSession[];
  message?: string;
  recover: (session: PendingSession) => Promise<void>;
  continueCurrent: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className='grid h-full place-items-center overflow-auto px-6 py-8'>
      <section className='w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm'
        aria-labelledby='pending-sessions-title'>
        <h1 id='pending-sessions-title' className='text-xl font-bold text-slate-900'>Há alterações pendentes em outra sessão</h1>
        <p className='mt-3 text-sm leading-6 text-slate-700'>
          Encontramos filas desta conta salvas neste navegador. Para retomar uma delas aqui,
          feche a aba anterior. A retomada transfere a fila para esta aba e tenta sincronizar;
          divergências com o servidor ainda exigem sua decisão.
        </p>
        <ul className='my-4 space-y-3'>
          {sessions.map((session, index) => (
            <li key={session.sessionId} className='rounded-lg border p-3 text-sm'>
              <p>Fila {index + 1}: {session.documentCount} construção(ões)</p>
              <p className='mb-2 text-slate-600'>Salva em {new Date(session.savedAt).toLocaleString('pt-BR')}</p>
              <Button type='button' disabled={busy} onClick={async () => {
                setBusy(true);
                try { await recover(session); } finally { setBusy(false); }
              }}>Retomar esta fila</Button>
            </li>
          ))}
        </ul>
        {message ? <p role='alert' className='mb-3 text-sm text-red-700'>{message}</p> : null}
        <Button type='button' variant='outline' disabled={busy} onClick={continueCurrent}>
          Continuar sem retomar outras filas
        </Button>
        <p className='mt-2 text-xs text-slate-600'>Continuar mantém as outras filas intactas neste navegador.</p>
      </section>
    </div>
  );
}
