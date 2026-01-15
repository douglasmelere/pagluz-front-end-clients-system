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
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-gradient-pagluz rounded-2xl blur-xl opacity-75 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-pagluz rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-110 transition-transform duration-500 group">
                <PagluzLogo className="h-12 w-12 text-white group-hover:drop-shadow-lg" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent mb-2">
              Pagluz
            </h1>
            <p className="text-slate-300 text-sm font-medium">
              Plataforma Inteligente de Gestão Energética
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
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

