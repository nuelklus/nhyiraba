'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

function DashboardContent() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard />;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* <TokenStatus /> */} // Temporarily disabled to debug CSS loading
      <DashboardContent />
    </ProtectedRoute>
  );
}
