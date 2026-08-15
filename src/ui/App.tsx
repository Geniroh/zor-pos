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
import CustomersCare from "./pages/CustomersCare";
import CustomerDirectory from "./pages/CustomerDirectory";
import PatientFolders from "./pages/PatientFolders";
import CustomerDetail from "./pages/CustomerDetail";
import FollowUpsOutreach from "./pages/FollowUpsOutreach";
import Consultations from "./pages/Consultations";
import Reports from "./pages/Reports";
import ReportsOverview from "./pages/ReportsOverview";
import SalesReport from "./pages/SalesReport";
import CategoryReport from "./pages/CategoryReport";
import ProductsReport from "./pages/ProductsReport";
import PaymentReport from "./pages/PaymentReport";
import CustomerReport from "./pages/CustomerReport";
import CareReport from "./pages/CareReport";
import Settings from "./pages/Settings";
import UsersRoles from "./pages/UsersRoles";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Roles from "./pages/Roles";
import RoleDetail from "./pages/RoleDetail";
import Invitations from "./pages/Invitations";
import DevicesSecurity from "./pages/DevicesSecurity";
import MyProfile from "./pages/MyProfile";
import SettingsProfile from "./pages/SettingsProfile";
import SettingsBranches from "./pages/SettingsBranches";
import SettingsBranchDetail from "./pages/SettingsBranchDetail";
import SettingsHours from "./pages/SettingsHours";
import SettingsPreferences from "./pages/SettingsPreferences";
import SettingsNotifications from "./pages/SettingsNotifications";
import SettingsBilling from "./pages/SettingsBilling";
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
import { SettingsProvider } from "./context/SettingsContext";
import { UsersProvider } from "./context/UsersContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AiAssistProvider>
          <SettingsProvider>
            <UsersProvider>
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
                      if (path === "customers") {
                        return (
                          <Route
                            key={label}
                            path={path}
                            element={<CustomersCare />}
                          />
                        );
                      }
                      if (path === "reports") {
                        return (
                          <Route key={label} path={path} element={<Reports />} />
                        );
                      }
                      if (path === "settings") {
                        return (
                          <Route key={label} path={path} element={<Settings />} />
                        );
                      }
                      if (path === "users-roles") {
                        return (
                          <Route key={label} path={path} element={<UsersRoles />} />
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
                    <Route
                      path="customers/directory"
                      element={<CustomerDirectory />}
                    />
                    <Route
                      path="customers/patients"
                      element={<PatientFolders />}
                    />
                    <Route
                      path="customers/follow-ups"
                      element={<FollowUpsOutreach />}
                    />
                    <Route
                      path="customers/consultations"
                      element={<Consultations />}
                    />
                    <Route
                      path="reports/overview"
                      element={<ReportsOverview />}
                    />
                    <Route path="reports/sales" element={<SalesReport />} />
                    <Route
                      path="reports/categories"
                      element={<CategoryReport />}
                    />
                    <Route path="reports/products" element={<ProductsReport />} />
                    <Route path="reports/payments" element={<PaymentReport />} />
                    <Route
                      path="reports/customers"
                      element={<CustomerReport />}
                    />
                    <Route path="reports/care" element={<CareReport />} />
                    <Route
                      path="settings/profile"
                      element={<SettingsProfile />}
                    />
                    <Route
                      path="settings/branches"
                      element={<SettingsBranches />}
                    />
                    {/* Static settings sub-routes above win over this one. */}
                    <Route
                      path="settings/branches/:branchId"
                      element={<SettingsBranchDetail />}
                    />
                    <Route path="settings/hours" element={<SettingsHours />} />
                    <Route
                      path="settings/preferences"
                      element={<SettingsPreferences />}
                    />
                    <Route
                      path="settings/notifications"
                      element={<SettingsNotifications />}
                    />
                    <Route path="settings/billing" element={<SettingsBilling />} />
                    <Route
                      path="users-roles/profile"
                      element={<MyProfile />}
                    />
                    <Route path="users-roles/users" element={<Users />} />
                    {/* Static users-roles sub-routes above win over these. */}
                    <Route
                      path="users-roles/users/:userId"
                      element={<UserDetail />}
                    />
                    <Route path="users-roles/roles" element={<Roles />} />
                    <Route
                      path="users-roles/roles/:roleId"
                      element={<RoleDetail />}
                    />
                    <Route
                      path="users-roles/invitations"
                      element={<Invitations />}
                    />
                    <Route
                      path="users-roles/devices"
                      element={<DevicesSecurity />}
                    />
                    {/* Static customer sub-routes above win over this dynamic one. */}
                    <Route
                      path="customers/:customerId"
                      element={<CustomerDetail />}
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
            </UsersProvider>
          </SettingsProvider>
        </AiAssistProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
