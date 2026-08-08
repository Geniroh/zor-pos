import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Sales from "./pages/Sales";
import SalesHistory from "./pages/SalesHistory";
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
                  {NAV_ITEMS.map(({ label, path }) =>
                    path === "" ? (
                      <Route key={label} index element={<Sales />} />
                    ) : (
                      <Route
                        key={label}
                        path={path}
                        element={<PlaceholderPage title={label} />}
                      />
                    ),
                  )}
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
