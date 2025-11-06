export class UsageLimitReachedError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super(`Daily AI request limit of ${limit} reached.`);
    this.name = "UsageLimitReachedError";
    this.limit = limit;
  }
}
