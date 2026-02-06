import { ClassConstructor, plainToInstance } from "class-transformer";
import { DURATION_CONSTANTS } from "constants/duration";

export const generateKSUID = async (prefix?: string) => {
  const ksuidModule = await import("@thi.ng/ksuid/ulid");

  const { ULID } = ksuidModule;
  const ksuid = new ULID();

  if (prefix) {
    return `${prefix}_${ksuid.next()}`;
  }

  return ksuid.next();
};

export const transformToInstance = <T, V>(cls: ClassConstructor<T>, data: V): T => {
  return plainToInstance(cls, data, {
    excludeExtraneousValues: true,
  });
};

export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

export const getPaginatedData = (data: object, page: number, limit: number, total: number) => {
  return {
    data,
    total,
    page,
    limit,
    totalPages: calculateTotalPages(total, limit),
  };
};

export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

export const thirtyDaysAgo = (): Date => {
  return new Date(Date.now() - DURATION_CONSTANTS.THIRTY_DAYS_IN_MS);
};
