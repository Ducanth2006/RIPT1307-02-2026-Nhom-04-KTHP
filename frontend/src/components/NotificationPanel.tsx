import React, { useState, useMemo } from 'react';
import { Button, List } from 'antd';
import { Package, AlertTriangle, ShieldAlert, CheckCircle, Clock, CheckCheck, Trash2, Bell } from 'lucide-react';

const initialNotifications = [
  {
    id: '1',
    title: 'High-Priority Support Ticket',
    description: 'Ticket #TKT-8902 has been open for more than 24 hours without resolution.',
    time: '10 mins ago',
    type: 'warning',
    read: false,
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    id: '2',
    title: 'New Wholesale Order',
    description: 'Order #ORD-8091 from Michael Jordan for $1,250.00 requires packing.',
    time: '2 hours ago',
    type: 'success',
    read: false,
    icon: Package,
    color: 'text-[#00799c]',
    bg: 'bg-[#e0f2fe]',
  },
  {
    id: '3',
    title: 'Multiple Failed Logins',
    description: 'User Mike Johnson has been locked out after 5 failed login attempts.',
    time: '5 hours ago',
    type: 'error',
    read: true,
    icon: ShieldAlert,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    id: '4',
    title: 'Low Stock Alert',
    description: 'Championship Series Basketball stock has reached 0.',
    time: '1 day ago',
    type: 'warning',
    read: true,
    icon: Package,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    id: '5',
    title: 'System Maintenance',
    description: 'Scheduled Redis cache clearance completed successfully.',
    time: '2 days ago',
    type: 'info',
    read: true,
    icon: CheckCircle,
    color: 'text-[#57657a]',
    bg: 'bg-[#d5e3fc]',
  },
];

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-[360px] max-h-[500px] flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0 border-b border-[#eceef0] shrink-0 bg-[#fbfcfd]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#191c1e]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-[#af101a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button 
              type="text" 
              size="small" 
              icon={<CheckCheck size={16} />} 
              onClick={handleMarkAllAsRead} 
              className="text-[#5b403d] hover:text-[#191c1e]" 
              title="Mark all as read"
            />
            <Button 
              type="text" 
              size="small" 
              icon={<Trash2 size={16} />} 
              onClick={handleClearAll} 
              className="text-[#5b403d] hover:text-red-500" 
              title="Clear all"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-5">
          <button 
            onClick={() => setActiveTab('all')}
            className={`text-sm font-medium pb-3 border-b-2 transition-colors relative ${activeTab === 'all' ? 'border-[#00799c] text-[#00799c]' : 'border-transparent text-[#5b403d] hover:text-[#191c1e]'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('unread')}
            className={`text-sm font-medium pb-3 border-b-2 transition-colors relative ${activeTab === 'unread' ? 'border-[#00799c] text-[#00799c]' : 'border-transparent text-[#5b403d] hover:text-[#191c1e]'}`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <List
          itemLayout="horizontal"
          dataSource={filteredNotifications}
          renderItem={(item: typeof initialNotifications[0]) => (
            <List.Item
              className={`p-4 hover:bg-[#f7f9fb] transition-colors border-b border-[#eceef0] last:border-b-0 cursor-pointer ${
                !item.read ? 'bg-[#f0f8ff]/40' : ''
              }`}
              onClick={() => handleMarkAsRead(item.id)}
            >
              <div className="flex w-full gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.bg} ${item.color}`}
                >
                  <item.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4
                      className={`text-[13px] font-semibold truncate pr-2 ${
                        !item.read ? 'text-[#191c1e]' : 'text-[#191c1e]/70'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-[#5b403d] shrink-0 mt-0.5">
                      <Clock size={12} className="opacity-70" />
                      {item.time}
                    </div>
                  </div>
                  <p
                    className={`text-xs line-clamp-2 leading-relaxed ${
                      !item.read ? 'text-[#5b403d]' : 'text-[#8f6f6c]'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
                {!item.read && (
                  <div className="flex items-center justify-center shrink-0 w-3">
                    <div className="w-2 h-2 rounded-full bg-[#00799c] shadow-sm" />
                  </div>
                )}
              </div>
            </List.Item>
          )}
        />
        {filteredNotifications.length === 0 && (
          <div className="py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-4 border border-[#eceef0]">
              <Bell size={24} className="text-[#d8dadc]" />
            </div>
            <h4 className="text-sm font-semibold text-[#191c1e] mb-1">No notifications</h4>
            <p className="text-xs text-[#5b403d]">
              {activeTab === 'unread' ? "You've read all your notifications." : "You don't have any notifications yet."}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-[#eceef0] bg-[#fbfcfd] text-center shrink-0">
        <Button type="text" className="text-[13px] font-medium text-[#00799c] hover:text-[#005f7b] w-full">
          View All Activity
        </Button>
      </div>
    </div>
  );
}
