import { useState } from "react";
import { NavPageId } from "./types/navigation";
import { AppLayout } from "./components/layout/AppLayout";
import { DatabaseProvider } from "./context/DatabaseContext";
import { AccueilPage } from "./pages/AccueilPage";
import { FacturesPage } from "./pages/FacturesPage";
import { DevisPage } from "./pages/DevisPage";
import { ClientsPage } from "./pages/ClientsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ParametresPage } from "./pages/ParametresPage";

export function App() {
  const [currentPage, setCurrentPage] = useState<NavPageId>("accueil");
  const [targetInvoiceId, setTargetInvoiceId] = useState<number | null>(null);

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
    <DatabaseProvider>
      <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderContent()}
      </AppLayout>
    </DatabaseProvider>
  );
}

export default App;
