import axiosInstance from "../../utils/axiosConfig";
import ip from "../../utils/ip";

const BASE_URL = `${ip}/admin/reports`;

export interface ReportParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
}

export const getAdminReportData = async (params: ReportParams = {}) => {
  const queryParams: Record<string, string> = {};
  if (params.timeRange) queryParams.timeRange = params.timeRange;
  if (params.startDate) queryParams.startDate = params.startDate;
  if (params.endDate) queryParams.endDate = params.endDate;

  const response = await axiosInstance.get(`${BASE_URL}/data`, { params: queryParams });
  return response.data;
};
