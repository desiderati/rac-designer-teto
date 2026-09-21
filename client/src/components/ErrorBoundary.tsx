import {AlertTriangle, RefreshCw} from 'lucide-react';
import {Component, ReactNode} from 'react';
import {isChunkLoadError, requestChunkRecovery} from '@/shared/lib/runtime-resilience.ts';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error) {
    if (isChunkLoadError(error)) requestChunkRecovery(error);
  }

  handleRetry = () => {
    if (this.state.error && requestChunkRecovery(this.state.error)) return;
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadError(this.state.error);
      return (
        <div className='flex min-h-screen items-center justify-center bg-background p-8'>
          <div className='flex w-full max-w-lg flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
            {chunkError ? (
              <RefreshCw size={44} className='mb-5 text-primary'/>
            ) : (
              <AlertTriangle size={44} className='mb-5 text-destructive'/>
            )}

            <h2 className='mb-3 text-xl font-semibold text-card-foreground'>
              {chunkError ? 'Estamos atualizando o Editor de RAC' : 'Ocorreu um erro inesperado'}
            </h2>
            <p className='mb-6 text-sm leading-6 text-muted-foreground'>
              {chunkError
                ? 'Uma atualização da aplicação ainda não terminou de carregar. A página será atualizada automaticamente; se necessário, tente novamente.'
                : 'Não foi possível concluir esta etapa. Atualize a página e tente novamente.'}
            </p>

            <button
              onClick={this.handleRetry}
              className='flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90'
            >
              <RefreshCw size={16}/>
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
