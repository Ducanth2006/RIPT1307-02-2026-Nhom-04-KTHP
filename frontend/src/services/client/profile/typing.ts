export interface IProfile {
  id: number;
  email: string;
  full_name: string;
  avatar: string;
  role: string;
  status: string;
  created_at: string;
}

export interface IProfileResponse {
  data: IProfile;
}

export interface IUpdateProfileRequest {
  userId: number;
  full_name: string;
  avatar?: string;
}

export interface IChangePasswordRequest {
  userId: number;
  currentPassword?: string;
  newPassword?: string;
}
