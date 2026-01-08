import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ContractForm } from '../contracts/components/ContractForm';

export default function Contratos() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <ContractForm authData={user} onLogout={logout} />
    </div>
  );
}


