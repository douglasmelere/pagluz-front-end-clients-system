
import { useAuth } from '../hooks/useAuth';
import { ContractForm } from '../contracts/components/ContractForm';

export default function Contratos() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ContractForm authData={user} onLogout={logout} />
    </div>
  );
}


