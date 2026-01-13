export type ErrorResponse = {
  requestId: string | null;
  path: string;
  method: string;
  statusCode: number;
  error: string;
  message: string[];
  timestamp: number;
};
