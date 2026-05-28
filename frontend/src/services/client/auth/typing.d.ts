export namespace Auth {
  export interface IUser {
    id: number;
    email: string;
    full_name: string;
    avatar?: string;
    role: string;
    status?: string;
    created_at?: string;
    username?: string;
    avatar_url?: string;
  }

  export interface ILoginRequest {
    email: string;
    password: string;
  }

  export interface IRegisterRequest {
    email: string;
    password: string;
    full_name: string;
  }

  export interface ILoginResponse {
    message: string;
    data: IUser;
    token: string;
  }

  export interface IRegisterResponse {
    message: string;
    data: IUser;
    token: string;
  }
}
