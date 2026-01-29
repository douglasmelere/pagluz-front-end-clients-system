import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './common/LoadingSpinner';
import { Eye, EyeOff, User, Lock, ArrowRight } from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/security';

export default function Login() {
  const { login, loading: authLoading } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Sanitização dos inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail || !sanitizedPassword) {
      toast.showError('Por favor, preencha todos os campos.');
      return;
    }

    // Validação de email
    if (!validateEmail(sanitizedEmail)) {
      toast.showError('Por favor, insira um email válido.');
      return;
    }

    // Validação básica de senha
    if (sanitizedPassword.length === 0) {
      toast.showError('Por favor, insira sua senha.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: sanitizedEmail, password: sanitizedPassword });
      toast.showSuccess('Login realizado com sucesso!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao fazer login. Tente novamente.';
      toast.showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-900">
              <PagluzLogo className="h-16 w-16 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]" />
            </div>
            <h1 className="mt-4 text-3xl font-display">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse o sistema para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={authLoading || isSubmitting}
                  className="h-12 w-full rounded-xl border border-border bg-transparent pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                />
              </div>
            </div>

            {/* Senha Input */}
            <div>
              <label className="mb-2 block text-sm font-medium">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={authLoading || isSubmitting}
                  className="h-12 w-full rounded-xl border border-border bg-transparent pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={authLoading || isSubmitting || !email || !password}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white transition-all hover:-translate-y-0.5 hover:shadow-accent-lg disabled:opacity-50"
            >
              {authLoading || isSubmitting ? 'Autenticando…' : 'Entrar'}
              {!authLoading && !isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
      {authLoading && <LoadingSpinner />}
    </div>
  );
}

