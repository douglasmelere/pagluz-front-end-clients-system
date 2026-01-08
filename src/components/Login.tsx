import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './common/LoadingSpinner';
import { Zap, Eye, EyeOff, User, Lock, Shield, Leaf, Wind } from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/security';

export default function Login() {
  const { login, loading: authLoading } = useApp();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    // Validação básica de senha (apenas verificar se não está vazia)
    if (sanitizedPassword.length === 0) {
      toast.showError('Por favor, insira sua senha.');
      return;
    }

    try {
      await login({ email: sanitizedEmail, password: sanitizedPassword });
      toast.showSuccess('Login realizado com sucesso!');
      // O redirecionamento acontece automaticamente via AppContext
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro ao fazer login. Tente novamente.';
      toast.showError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo animado */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Elementos flutuantes */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-green-400/40 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-emerald-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-32 w-5 h-5 bg-blue-400/40 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-green-400/40 rounded-full animate-bounce delay-500"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-500">
          {/* Logo e Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-36 h-36 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl mb-6 shadow-[0_4px_14px_0_rgba(22,163,74,0.25)] hover:shadow-[0_0_20px_rgba(0,255,136,0.35)] hover:scale-110 transition-transform duration-300 group">
              <PagluzLogo className="h-24 w-24 text-white group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Sistema de Gestão Energética
            </h2>
            <p className="text-slate-600 text-sm">
              Plataforma inteligente para energia renovável
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-3 group-focus-within:text-green-600 transition-colors duration-200">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors duration-200" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg hover:border-green-300 hover:shadow-md"
                  placeholder="Digite seu e-mail"
                  required
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-3 group-focus-within:text-green-600 transition-colors duration-200">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg hover:border-green-300 hover:shadow-md"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-slate-100 rounded-r-2xl transition-all duration-200 group"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600 group-hover:scale-110 transition-all duration-200" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600 group-hover:scale-110 transition-all duration-200" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl text-lg group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {authLoading ? (
                <div className="flex items-center justify-center relative z-10">
                  <LoadingSpinner size="sm" className="mr-3" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center justify-center relative z-10">
                  <Shield className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  Entrar no Sistema
                </div>
              )}
            </button>
          </form>

          {/* Features com ícones de energia renovável */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center text-sm text-slate-600 hover:text-emerald-600 transition-colors duration-200 group">
                <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full mr-3 group-hover:bg-emerald-500/30 transition-colors duration-200">
                  <PagluzLogo className="h-3 w-3 text-emerald-600 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <span>Gestão completa de geradores solares</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 hover:text-[#0c3a59] transition-colors duration-200 group">
                <div className="flex items-center justify-center w-6 h-6 bg-[#0c3a59]/20 rounded-full mr-3 group-hover:bg-[#0c3a59]/30 transition-colors duration-200">
                  <Wind className="h-3 w-3 text-[#0c3a59] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span>Alocação inteligente de energia renovável</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 hover:text-[#00ff88] transition-colors duration-200 group">
                <div className="flex items-center justify-center w-6 h-6 bg-[#00ff88]/20 rounded-full mr-3 group-hover:bg-[#00ff88]/30 transition-colors duration-200">
                  <Zap className="h-3 w-3 text-[#00ff88] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span>Relatórios e analytics em tempo real</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 hover:text-[#ffcc00] transition-colors duration-200 group">
                <div className="flex items-center justify-center w-6 h-6 bg-[#ffcc00]/20 rounded-full mr-3 group-hover:bg-[#ffcc00]/30 transition-colors duration-200">
                  <Leaf className="h-3 w-3 text-[#ffcc00] group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <span>Sustentabilidade e economia energética</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 mb-2">
              Entre com suas credenciais de acesso
            </p>
            <p className="text-xs text-slate-400">
              © 2024 PagLuz. Todos os direitos reservados.
            </p>
          </div>
        </div>

        {/* Elementos decorativos flutuantes */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-green-400/30 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute -top-2 -right-6 w-6 h-6 bg-emerald-400/30 rounded-full blur-sm animate-pulse delay-300"></div>
        <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-blue-400/30 rounded-full blur-sm animate-pulse delay-700"></div>
        <div className="absolute -bottom-2 -left-6 w-4 h-4 bg-green-400/30 rounded-full blur-sm animate-pulse delay-1000"></div>
        
        {/* Círculos decorativos adicionais */}
        <div className="absolute top-1/4 -left-8 w-12 h-12 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 -right-8 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-1500"></div>
      </div>

      {/* Partículas flutuantes de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-green-400/60 rounded-full animate-ping delay-200"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-emerald-400/60 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/4 left-3/4 w-1 h-1 bg-blue-400/60 rounded-full animate-ping delay-1200"></div>
        <div className="absolute top-1/2 right-1/2 w-1 h-1 bg-cyan-400/60 rounded-full animate-ping delay-1700"></div>
      </div>
    </div>
  );
}

