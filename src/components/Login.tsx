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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo premium */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orbs animados */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid subtle */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-md w-full relative z-10">
        {/* Card Premium */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 border border-white/20 hover:border-emerald-400/40 transition-all duration-500 hover:shadow-emerald-500/10">
          
          {/* Header com Logo */}
          <div className="text-center -mt-6">
            <div className="inline-flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-pagluz rounded-full blur-3xl opacity-70 animate-pulse"></div>
              <PagluzLogo className="h-64 w-64 text-white hover:scale-110 transition-transform duration-500 relative z-10 drop-shadow-2xl scale-150" />
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5 -mt-6">
            
            {/* Email Input */}
            <div className="relative group">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={authLoading || isSubmitting}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Senha Input */}
            <div className="relative group">
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={authLoading || isSubmitting}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={authLoading || isSubmitting || !email || !password}
              className="w-full group relative mt-8 py-3.5 px-6 bg-gradient-pagluz text-white font-bold rounded-xl hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              
              {authLoading || isSubmitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Info Footer */}
          <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-xs text-slate-300 text-center">
              🔒 Sua conexão é segura e criptografada. Seus dados nunca são compartilhados com terceiros.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Sistema de Gestão Energética © 2024</p>
          <p className="text-slate-500 mt-2">Transformando o futuro da energia</p>
        </div>
      </div>

      {/* Loading Spinner Global */}
      {authLoading && <LoadingSpinner />}
    </div>
  );
}

