export class ThirdPartyApiError extends Error {
  public readonly status?: number;
  public readonly data?: unknown;
  public readonly causeError?: Error;

  constructor(message: string, status?: number, data?: unknown, causeError?: Error) {
    super(message);
    this.name = 'ThirdPartyApiError';
    this.status = status;
    this.data = data;
    this.causeError = causeError;
  }
}


