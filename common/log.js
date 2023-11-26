import { format, createLogger, transports } from 'winston';
const { combine, json, timestamp } = format;
import 'winston-daily-rotate-file';

const fileRotateTransport = new transports.DailyRotateFile({
  filename: "logs/rotate-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d",
  timestamp: true
});

const logger = createLogger({
  level: "debug",
  format: combine(timestamp(), json()),
  transports: [fileRotateTransport],
});

export default logger;
