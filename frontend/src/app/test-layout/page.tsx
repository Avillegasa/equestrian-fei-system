// frontend/src/app/test-layout/page.tsx
'use client'

import DashboardLayoutNoAuth from '@/components/layout/DashboardLayoutNoAuth'  // ✅ Esta línea
import DashboardCards from '@/components/dashboard/DashboardCards'

const mockUser = {
  id: 1,
  first_name: 'Juan',
  last_name: 'Pérez',
  full_name: 'Juan Pérez',
  email: 'juan@test.com',
  role: 'ADMIN' as const,
  is_staff: true,
  is_active: true
}

export default function TestLayoutPage() {
  return (
    <DashboardLayoutNoAuth user={mockUser} title="Dashboard Cards - Subfase 6.5.2.3">  {/* ✅ Y esta línea */}
      <DashboardCards />
    </DashboardLayoutNoAuth>
  )
}