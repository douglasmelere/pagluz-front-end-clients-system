import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './common/LoadingSpinner';
import { Eye, EyeOff, User, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
import { validateEmail, sanitizeInput } from '../utils/security';

export default function Login() {
  const { login, loading: authLoading } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Sanitização dos inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);

    if (!sanitizedEmail || !sanitizedPassword) {
      toast.showError('Por favor, preencha todos os campos para continuar.');
      return;
    }

    // Validação de email
    if (!validateEmail(sanitizedEmail)) {
      toast.showError('O endereço de email informado não é válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: sanitizedEmail, password: sanitizedPassword });
      toast.showSuccess('Bem-vindo de volta! Login realizado com sucesso.');
    } catch (error: any) {
      const errorMessage = error?.message || 'Falha ao autenticar. Verifique suas credenciais.';
      toast.showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50 to-transparent" />
        <div className="absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] h-[400px] w-[400px] rounded-full bg-blue-400/5 blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-4">
        {/* Main Card */}
        <div className="group overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">

          {/* Full Width Header */}
          <div className="relative bg-gradient-to-br from-accent to-accent-secondary h-48 flex items-center justify-center overflow-hidden">
            <div className="flex justify-center w-full">
              <PagluzLogo className="h-48 w-auto text-white drop-shadow-lg scale-[1.8]" />
            </div>
          </div>

          <div className="relative bg-white/60 p-8 sm:p-10 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email Input */}
              <div className="group/input space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-focus-within/input:text-accent transition-colors">
                  Email
                </label>
                <div className={`relative flex items-center rounded-full border transition-all duration-300 ${focusedField === 'email' ? 'border-accent ring-4 ring-accent/10 bg-white' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'}`}>
                  <div className="flex h-12 w-12 items-center justify-center text-slate-400">
                    <User className={`h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-accent' : ''}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="exemplo@empresa.com"
                    disabled={authLoading || isSubmitting}
                    className="h-12 w-full bg-transparent pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 font-display"
                  />
                  {validateEmail(email) && (
                    <div className="absolute right-4 text-emerald-500 animate-in fade-in zoom-in duration-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="group/input space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-focus-within/input:text-accent transition-colors">
                    Senha
                  </label>
                  <a href="#" className="text-xs font-medium text-slate-500 hover:text-accent transition-colors">
                    Esqueceu?
                  </a>
                </div>
                <div className={`relative flex items-center rounded-full border transition-all duration-300 ${focusedField === 'password' ? 'border-accent ring-4 ring-accent/10 bg-white' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white'}`}>
                  <div className="flex h-12 w-12 items-center justify-center text-slate-400">
                    <Lock className={`h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-accent' : ''}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    disabled={authLoading || isSubmitting}
                    className="h-12 w-full bg-transparent pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 flex h-12 w-12 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading || isSubmitting || !email || !password}
                className="group relative mt-2 flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-accent p-[1px] text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 font-display"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-secondary opacity-100 transition-opacity group-hover:opacity-90" />

                <span className="relative flex items-center gap-2 text-sm font-semibold tracking-wide">
                  {authLoading || isSubmitting ? (
                    'Autenticando...'
                  ) : (
                    <>
                      Entrar no Sistema
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer Decoration */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Pagluz. Todos os direitos reservados.
        </p>
      </div>

      {authLoading && <LoadingSpinner />}
    </div>
  );
}
