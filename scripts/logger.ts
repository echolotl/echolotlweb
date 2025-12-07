export class Logger {
  private context: string;
  private color: string = "\x1b[36m";

  private errorColor: string = "\x1b[31m";
  private warnColor: string = "\x1b[33m";
  private infoColor: string = "\x1b[34m";

  constructor(context: string, color?: string) {
    this.context = context;
    this.color = color
      ? Bun.color(color, "ansi-16m") || this.color
      : this.color;
  }
  log(message: string, ...optionalParams: any[]) {
    console.log(
      `${this.color}[${this.context}] \x1b[0m${message}`,
      ...optionalParams,
    );
  }
  error(message: string, ...optionalParams: any[]) {
    console.error(
      `${this.errorColor}[${this.context} ERROR] \x1b[0m ${message}`,
      ...optionalParams,
    );
  }
  warn(message: string, ...optionalParams: any[]) {
    console.warn(
      `${this.warnColor}[${this.context} WARN] \x1b[0m ${message}`,
      ...optionalParams,
    );
  }
  info(message: string, ...optionalParams: any[]) {
    console.info(
      `${this.infoColor}[${this.context} INFO] \x1b[0m ${message}`,
      ...optionalParams,
    );
  }
}
