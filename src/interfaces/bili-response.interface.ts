export interface BiliResponse<T> {
  code: number;
  message: string;
  ttl: number;
  data: T;
}