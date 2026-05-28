export interface ApiResponse<T> {
  data: T;
  total?: number;
}

export interface ApiError {
  detail: string;
}
