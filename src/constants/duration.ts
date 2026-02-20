export const DURATION_CONSTANTS = {
  ONE_HOUR_IN_MS: 60 * 60 * 1000,
  ONE_DAY_IN_MS: 24 * 60 * 60 * 1000,
  ONE_DAY_IN_SEC: 24 * 60 * 60,
  ONE_HOUR_IN_SEC: 60 * 60,
  FIVE_MIN_IN_SEC: 5 * 60,
  TWO_MIN_IN_SEC: 2 * 60,
};

export const TIME_VALUES = {
  THIRTY: 30,
};

export const TIME_UNITS = {
  DAYS: "days",
} as const;

export const DATE_FORMATS = {
  YMD_HMS_TIMESTAMP: "yyyyMMddHHmmss",
} as const;
