export type ApiResult<T> = {
  code: number;
  message: string;
  data: T;
};

export type PageResult<T> = {
  total: number;
  pageNum: number;
  pageSize: number;
  records: T[];
};
