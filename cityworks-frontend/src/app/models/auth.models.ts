export interface LoginRequest {
  username: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  password: string;
  role: string;
  email: string;
}

export interface CitizenResponse {
  userId: number;
  name: string;
  username: string;
  email: string;
  status: string;
  role: string;
}

export interface UserResponse {
  id: number;
  name: string;
  username: string;
  role: string;
  status: string;
}
