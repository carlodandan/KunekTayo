import { Component, ErrorInfo, ReactNode } from "react";
import { WarningCircle, ArrowClockwise, House } from "@phosphor-icons/react";
import { Button } from "./Button";
import { Card } from "./Card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled runtime error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    // Clear room state and return to idle
    window.location.hash = "";
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <Card
            elevated
            className="w-full max-w-md bg-slate-900 border-red-900/40 p-6 text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-950/50 border border-red-800/60 mx-auto flex items-center justify-center text-red-400">
              <WarningCircle size={32} weight="bold" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">Something went wrong</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected error occurred in KunekTayo. Your session and privacy remain protected.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-left overflow-x-auto text-[11px] font-mono text-red-300">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleReset}
                icon={<House size={18} weight="bold" />}
                className="flex-1 min-h-[44px]"
              >
                Home
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReload}
                icon={<ArrowClockwise size={18} weight="bold" />}
                className="flex-1 min-h-[44px]"
              >
                Reload
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
