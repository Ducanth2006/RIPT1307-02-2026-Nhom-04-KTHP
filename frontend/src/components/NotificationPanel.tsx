import React, { useState, useMemo, useEffect } from 'react';
import { Button, List, Spin } from 'antd';
import { Package, AlertTriangle, ShieldAlert, CheckCircle, Clock, CheckCheck, Trash2, Bell, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotificationsApi, readNotificationApi, readAllNotificationsApi } from '../services/client/notification/apiClient';

interface UINotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: string;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  icon: any;
  color: string;
  bg: string;
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("notification_sound_enabled") !== "false";
  });

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("notification_sound_enabled", String(newValue));
  };

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const userId = userObj?.id;

  const loadNotifications = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await getNotificationsApi(userId);
      const dataList = res.data?.data || (res.data as any)?.data || [];
      
      const adminTitles = ["Đơn hàng mới chờ duyệt", "Yêu cầu hủy đơn hàng mới", "Có khiếu nại mới cần xử lý"];
      const filteredList = dataList.filter((n: any) => adminTitles.includes(n.title));
      
      const uiList: UINotification[] = filteredList.map((n: any) => {
        let icon = Package;
        let color = 'text-[#00799c]';
        let bg = 'bg-[#e0f2fe]';
        
        if (n.type === 'warning') {
          icon = AlertTriangle;
          color = 'text-amber-500';
          bg = 'bg-amber-50';
        } else if (n.type === 'error') {
          icon = ShieldAlert;
          color = 'text-red-500';
          bg = 'bg-red-50';
        } else if (n.type === 'info') {
          icon = CheckCircle;
          color = 'text-[#57657a]';
          bg = 'bg-[#d5e3fc]';
        }
        
        // Calculate relative display time
        const diffMs = Date.now() - new Date(n.created_at).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let displayTime = 'Vừa xong';
        if (diffMins > 0 && diffMins < 60) {
          displayTime = `${diffMins} phút trước`;
        } else if (diffMins >= 60 && diffMins < 1440) {
          displayTime = `${Math.floor(diffMins / 60)} giờ trước`;
        } else if (diffMins >= 1440) {
          displayTime = `${Math.floor(diffMins / 1440)} ngày trước`;
        }
        
        return {
          id: String(n.id),
          title: n.title || 'Thông báo',
          description: n.message || '',
          time: displayTime,
          type: n.type || 'info',
          read: !!n.is_read,
          referenceId: n.reference_id,
          referenceType: n.reference_type,
          icon,
          color,
          bg
        };
      });
      setNotifications(uiList);
    } catch (err) {
      console.error("Lỗi khi tải danh sách thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Poll every 30s for new order notifications automatically (extremely responsive admin workflow!)
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await readAllNotificationsApi(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
    }
  };

  const handleItemClick = async (item: UINotification) => {
    if (!userId) return;
    
    if (!item.read) {
      try {
        await readNotificationApi(Number(item.id), userId);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    }

    if (item.referenceType === 'order' && item.referenceId) {
      navigate(`/admin/orders?openOrderId=${item.referenceId}`);
    } else if (item.referenceType === 'complaint') {
      navigate('/admin/complaints');
    }
  };
  
  const handleClearAll = () => {
    // Clear list locally
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
    <div className="w-[360px] max-h-[500px] flex flex-col bg-white overflow-hidden shadow-lg border border-gray-100 rounded-lg">
      {/* Header */}
      <div className="p-4 pb-0 border-b border-[#eceef0] shrink-0 bg-[#fbfcfd]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#191c1e]">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="bg-[#af101a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} MỚI
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button 
              type="text" 
              size="small" 
              icon={soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} 
              onClick={toggleSound} 
              className="text-[#5b403d] hover:text-[#191c1e]" 
              title={soundEnabled ? "Tắt âm thanh thông báo" : "Bật âm thanh thông báo"}
            />
            <Button 
              type="text" 
              size="small" 
              icon={<CheckCheck size={16} />} 
              onClick={handleMarkAllAsRead} 
              className="text-[#5b403d] hover:text-[#191c1e]" 
              title="Đánh dấu đã đọc tất cả"
            />
            <Button 
              type="text" 
              size="small" 
              icon={<Trash2 size={16} />} 
              onClick={handleClearAll} 
              className="text-[#5b403d] hover:text-red-500" 
              title="Xóa tất cả"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-5">
          <button 
            onClick={() => setActiveTab('all')}
            className={`text-sm font-semibold pb-3 border-b-2 transition-colors relative ${activeTab === 'all' ? 'border-[#af101a] text-[#af101a]' : 'border-transparent text-[#5b403d] hover:text-[#191c1e]'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setActiveTab('unread')}
            className={`text-sm font-semibold pb-3 border-b-2 transition-colors relative ${activeTab === 'unread' ? 'border-[#af101a] text-[#af101a]' : 'border-transparent text-[#5b403d] hover:text-[#191c1e]'}`}
          >
            Chưa đọc
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 custom-scrollbar min-h-[150px]">
        {loading && notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Spin size="small" />
            <p className="text-xs text-gray-400 mt-2">Đang tải...</p>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={filteredNotifications}
            renderItem={(item: UINotification) => (
              <List.Item
                className={`p-4 hover:bg-[#f7f9fb] transition-colors border-b border-[#eceef0] last:border-b-0 cursor-pointer ${
                  !item.read ? 'bg-[#ffdad6]/10' : ''
                }`}
                onClick={() => handleItemClick(item)}
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
                        className={`text-[13px] font-bold truncate pr-2 ${
                          !item.read ? 'text-[#191c1e]' : 'text-[#191c1e]/60'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-[#5b403d] shrink-0 mt-0.5 font-medium">
                        <Clock size={12} className="opacity-70" />
                        {item.time}
                      </div>
                    </div>
                    <p
                      className={`text-xs line-clamp-2 leading-relaxed font-medium ${
                        !item.read ? 'text-[#5b403d]' : 'text-[#8f6f6c]'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="flex items-center justify-center shrink-0 w-3">
                      <div className="w-2 h-2 rounded-full bg-[#af101a] shadow-sm" />
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
        
        {filteredNotifications.length === 0 && !loading && (
          <div className="py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f7f9fb] flex items-center justify-center mx-auto mb-4 border border-[#eceef0]">
              <Bell size={24} className="text-[#d8dadc]" />
            </div>
            <h4 className="text-sm font-semibold text-[#191c1e] mb-1">Không có thông báo</h4>
            <p className="text-xs text-[#5b403d]">
              {activeTab === 'unread' ? "Bạn đã đọc hết tất cả thông báo." : "Bạn chưa nhận được thông báo nào."}
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-[#eceef0] bg-[#fbfcfd] text-center shrink-0">
        <Button 
          type="text" 
          onClick={loadNotifications}
          className="text-[13px] font-bold text-[#af101a] hover:text-[#8d0c13] w-full"
        >
          Làm mới
        </Button>
      </div>
    </div>
  );
}
