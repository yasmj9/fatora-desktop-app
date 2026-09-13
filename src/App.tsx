import { useState } from "react";
import { NavPageId } from "./types/navigation";
import { AppLayout } from "./components/layout/AppLayout";
import { DatabaseProvider } from "./context/DatabaseContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InstallationSetupScreen } from "./components/auth/InstallationSetupScreen";
import { LoginScreen } from "./components/auth/LoginScreen";
import { ForceChangePasswordScreen } from "./components/auth/ForceChangePasswordScreen";
import { AccueilPage } from "./pages/AccueilPage";
import { FacturesPage } from "./pages/FacturesPage";
import { DevisPage } from "./pages/DevisPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ParametresPage } from "./pages/ParametresPage";

function AuthenticatedApp() {
  const { isLoading, hasInitialUser, isAuthenticated, mustChangePassword } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavPageId>("accueil");
  const [targetInvoiceId, setTargetInvoiceId] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Chargement de Fatora...</span>
        </div>
      </div>
    );
  }

  // 1. First-run installation step (no user exists)
  if (!hasInitialUser) {
    return <InstallationSetupScreen />;
  }

  // 2. User exists but not logged in
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // 3. User logged in but must change password (e.g., after emergency reset to 123456)
  if (mustChangePassword) {
    return <ForceChangePasswordScreen />;
  }

  // 4. Authenticated & password configured -> Main App
  const handleNavigateToInvoice = (invoiceId: number) => {
    setTargetInvoiceId(invoiceId);
    setCurrentPage("factures");
  };

  const renderContent = () => {
    switch (currentPage) {
      case "accueil":
        return <AccueilPage onNavigate={setCurrentPage} />;
      case "factures":
        return <FacturesPage initialInvoiceId={targetInvoiceId} />;
      case "devis":
        return <DevisPage onNavigateToInvoice={handleNavigateToInvoice} />;
      case "clients":
        return <ClientsPage />;
      case "services":
        return <ServicesPage />;
      case "parametres":
        return <ParametresPage />;
      default:
        return <AccueilPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderContent()}
    </AppLayout>
  );
}

export function App() {
  return (
    <DatabaseProvider>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </DatabaseProvider>
  );
}

export default App;
