import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import PlaceholderPage from "./pages/PlaceholderPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import TitleBar from "./components/layout/TitleBar";
import { NAV_ITEMS } from "./components/layout/nav-items";
import { SidebarProvider } from "./context/SidebarContext";
import "./App.css";

function App() {
  return (
    <SidebarProvider>
      <div className="app-shell">
        <TitleBar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Login />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              {NAV_ITEMS.map(({ label, path }) =>
                path === "" ? (
                  <Route
                    key={label}
                    index
                    element={<PlaceholderPage title={label} />}
                  />
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
    </SidebarProvider>
  );
}

export default App;
