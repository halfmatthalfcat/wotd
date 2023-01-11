import winston, { format } from "winston";

const { printf } = format;

const outputFormat = printf(
  ({ timestamp, level, message }) => `[${timestamp}] [${level}]: ${message}`
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    outputFormat,
    winston.format.colorize()
  ),
  transports: [new winston.transports.Console()],
});

export default logger;