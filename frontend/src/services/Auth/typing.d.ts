export namespace Auth {
  export interface IUser {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    role: "User" | "Admin";
  }

  export interface ILoginResponse {
    message: string;
    data: {
      user: IUser;
      access_token: string;
    };
  }

  export interface IRegisterResponse {
    message: string;
    data: IUser;
  }
}
