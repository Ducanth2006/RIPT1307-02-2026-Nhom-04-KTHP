import { createBrowserRouter, Navigate } from "react-router-dom";
import ClientLayout from "../components/layout/ClientLayout";
import AppLayout from "../components/AppLayout";
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
// import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/Admin/Dashboard";
import Products from "../pages/Admin/Products";
import Categories from "../pages/Admin/Categories";
import Orders from "../pages/Admin/Orders";
import UsersPage from "../pages/Admin/UsersPage";
import ReportsPage from "../pages/Admin/ReportsPage";
import VouchersPage from "../pages/Admin/VouchersPage";
import SettingsPage from "../pages/Admin/SettingsPage";
import ComplaintsPage from "../pages/Admin/ComplaintsPage";
import Inventory from "../pages/Admin/Inventory";
import AccountProfile from "../pages/Admin/AccountProfile";
import HelpCenter from "../pages/Admin/HelpCenter";
import AddProduct from "../pages/Admin/AddProduct";
import ProductGrid from "../pages/products/components/ProductGrid";
import ProductDetail from "../pages/products/components/ProductDetail";
import ProductReviewsPage from "../pages/products/ProductReviewsPage";
import Cart from "../pages/cart/Cart";
import Profile from "../pages/profile/Profile";
import ClientOrders from "../pages/orders/Orders";
import Notifications from "../pages/notifications/Notifications";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "products",
        element: <ProductGrid />,
      },
      {
        path: "products/:id",
        element: <ProductDetail />,
      },
      {
        path: "products/:id/reviews",
        element: <ProductReviewsPage />,
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "orders",
        element: <ClientOrders />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      // {
      //   path: "forgot-password",
      //   element: <ForgotPassword />,
      // },
    ],
  },
  {
    path: "/admin",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "products/new",
        element: <AddProduct />,
      },
      {
        path: "categories",
        element: <Categories />,
      },
      {
        path: "inventory",
        element: <Inventory />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "vouchers",
        element: <VouchersPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "complaints",
        element: <ComplaintsPage/>,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "account",
        element: <AccountProfile />,
      },
      {
        path: "help",
        element: <HelpCenter />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
