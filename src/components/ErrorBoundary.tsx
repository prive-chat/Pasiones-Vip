import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] border border-red-500/20">
            <AlertCircle size={40} />
          </div>
          
          <h1 className="mb-3 text-3xl font-black text-white uppercase italic tracking-tighter">
            Algo salió mal
          </h1>
          
          <p className="mb-8 max-w-md text-sm font-bold text-white/40 uppercase tracking-widest leading-relaxed">
            Hemos detectado un error inesperado. No te preocupes, tus datos están seguros. 
            Intenta recargar la página o volver al inicio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
            <Button 
              onClick={this.handleReset}
              className="flex-1 h-12 font-black uppercase tracking-widest"
            >
              <RefreshCw size={18} className="mr-2" />
              Recargar
            </Button>
            
            <Button 
              variant="secondary"
              onClick={() => window.location.href = '/'}
              className="flex-1 h-12 font-black uppercase tracking-widest"
            >
              <Home size={18} className="mr-2" />
              Inicio
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-12 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-6 text-left">
              <p className="mb-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Detalles del Error (Dev Only)</p>
              <pre className="overflow-x-auto text-xs text-red-400 font-mono">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
