import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package2,
  ShoppingCart,
  Users,
  Headset,
  Settings as SettingsIcon,
  Bell,
  HelpCircle,
  Search,
  Menu,
  FolderTree,
  User,
  LogOut,
  BarChart2,
  Ticket,
} from "lucide-react";
import { Avatar, Dropdown, Popover, FloatButton } from "antd";
import NotificationPanel from "./NotificationPanel";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleHelp = () => {
    navigate("/admin/help");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", path: "/admin/products", icon: Package2 },
    { name: "Categories", path: "/admin/categories", icon: FolderTree },
    { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Vouchers", path: "/admin/vouchers", icon: Ticket },
    { name: "Reports", path: "/admin/reports", icon: BarChart2 },
    { name: "Complaints", path: "/admin/complaints", icon: Headset },
    { name: "Settings", path: "/admin/settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#f7f9fb] font-sans text-[#191c1e] overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#f7f9fb] border-r border-[#e4beba] h-full py-6 z-40 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d32f2f] text-white flex items-center justify-center font-bold text-lg">
            P
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#af101a] leading-tight">ProSports ERP</h1>
            <p className="text-xs text-[#5b403d] mt-1">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto px-2">
          {navItems.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 my-0.5 rounded-lg transition-colors ${
                  isActive ? "text-[#af101a] font-bold bg-[#ffdad6]/50" : "text-[#5b403d] hover:bg-[#e0e3e5]"
                }`}
              >
                <Icon size={20} className={isActive ? "text-[#af101a]" : ""} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white sticky top-0 z-30 border-b border-[#e4beba] shadow-sm flex justify-between items-center h-16 px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-[#5b403d]">
              <Menu size={24} />
            </button>
            <div className="hidden md:block relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5b403d]" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-[#f7f9fb] border border-[#e4beba] rounded-md py-1.5 pl-10 pr-3 text-sm focus:outline-none focus:border-[#af101a] focus:ring-1 focus:ring-[#af101a]/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Popover
              content={<NotificationPanel />}
              trigger="click"
              placement="bottomRight"
              overlayInnerStyle={{ padding: 0, borderRadius: "8px" }}
            >
              <button className="text-[#5b403d] hover:text-[#af101a] relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-[#af101a] rounded-full"></span>
              </button>
            </Popover>
            <button className="text-[#5b403d] hover:text-[#af101a] hidden sm:block" onClick={handleHelp}>
              <HelpCircle size={20} />
            </button>
            <div className="h-6 w-px bg-[#e4beba] mx-2 hidden sm:block"></div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "account",
                    label: (
                      <Link to="/admin/account" className="flex items-center gap-2">
                        <User size={14} /> My Account
                      </Link>
                    ),
                  },
                  { type: "divider" },
                  {
                    key: "logout",
                    label: (
                      <Link to="/login" className="flex items-center gap-2 text-red-600">
                        <LogOut size={14} /> Logout
                      </Link>
                    ),
                  },
                ],
              }}
              placement="bottomRight"
            >
              <button className="flex items-center gap-2 hover:bg-[#eceef0] p-1 px-2 rounded transition-colors">
                <span className="text-sm font-medium hidden sm:block">Admin</span>
                <Avatar src="https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff" size="small" />
              </button>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f7f9fb]">
          <Outlet />
        </main>
        <FloatButton.BackTop style={{ right: 24, bottom: 24 }} />
      </div>
    </div>
  );
}
