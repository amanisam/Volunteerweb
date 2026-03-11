// @ts-nocheck
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
          <DashboardHeader />
          <main className="dashboard-content fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
