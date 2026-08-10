import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import ReceiveNewStock from "./pages/ReceiveNewStock";
import PurchaseHistory from "./pages/PurchaseHistory";
import SupplierManagement from "./pages/SupplierManagement";
import AccountsPayable from "./pages/AccountsPayable";
import AddProduct from "./pages/AddProduct";
import ViewProducts from "./pages/ViewProducts";
import StockLevels from "./pages/StockLevels";
import StockAdjustment from "./pages/StockAdjustment";
import PlaceholderPage from "./pages/PlaceholderPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import TitleBar from "./components/layout/TitleBar";
import { NAV_ITEMS } from "./components/layout/nav-items";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AiAssistProvider } from "./context/AiAssistContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AiAssistProvider>
          <div className="app-shell">
            <TitleBar />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/sales-history" element={<SalesHistory />} />

                <Route path="/dashboard" element={<DashboardLayout />}>
                  {NAV_ITEMS.map(({ label, path }) => {
                    if (path === "") {
                      return <Route key={label} index element={<Sales />} />;
                    }
                    if (path === "inventory") {
                      return (
                        <Route key={label} path={path} element={<Inventory />} />
                      );
                    }
                    if (path === "purchases") {
                      return (
                        <Route key={label} path={path} element={<Purchases />} />
                      );
                    }
                    return (
                      <Route
                        key={label}
                        path={path}
                        element={<PlaceholderPage title={label} />}
                      />
                    );
                  })}
                  <Route
                    path="inventory/add-product"
                    element={<AddProduct />}
                  />
                  <Route
                    path="inventory/view-product"
                    element={<ViewProducts />}
                  />
                  <Route
                    path="inventory/stock-levels"
                    element={<StockLevels />}
                  />
                  <Route
                    path="inventory/stock-adjustment"
                    element={<StockAdjustment />}
                  />
                  <Route
                    path="purchases/receive-stock"
                    element={<ReceiveNewStock />}
                  />
                  <Route
                    path="purchases/purchase-history"
                    element={<PurchaseHistory />}
                  />
                  <Route
                    path="purchases/suppliers"
                    element={<SupplierManagement />}
                  />
                  <Route
                    path="purchases/accounts-payable"
                    element={<AccountsPayable />}
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </AiAssistProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
