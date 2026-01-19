import { ClassConstructor, plainToInstance } from "class-transformer";

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
