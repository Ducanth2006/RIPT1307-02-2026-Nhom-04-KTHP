import axiosInstance from '../utils/axiosConfig';

// ==========================================
// GET SETTINGS
// ==========================================
export const layCauHinh = async () => {
  const response = await axiosInstance.get(
    '/admin/settings',
  );

  return response.data;
};

// ==========================================
// UPDATE SETTINGS
// ==========================================
export const capNhatCauHinh = async (
  data: any,
) => {
  const response = await axiosInstance.put(
    '/admin/settings',
    data,
  );

  return response.data;
};

// ==========================================
// TEST SMTP
// ==========================================
export const kiemTraSMTP = async (
  data: {
    smtpHost: string;
    smtpPort: string;
    smtpUser?: string;
  },
) => {
  const response = await axiosInstance.post(
    '/admin/settings/test-smtp',
    data,
  );

  return response.data;
};

// ==========================================
// CLEAR CACHE
// ==========================================
export const flushRedisCache =
  async () => {
    const response =
      await axiosInstance.post(
        '/admin/settings/clear-cache',
      );

    return response.data;
  };