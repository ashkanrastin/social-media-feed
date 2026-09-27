import { just, nothing, type Maybe } from 'true-myth/maybe';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value instanceof Object && !Array.isArray(value);
}

export function readString(record: Readonly<Record<string, unknown>>, key: string): Maybe<string> {
  const value = record[key];
  if (typeof value !== 'string') {
    return nothing();
  }
  return just(value);
}

export function readBoolean(record: Readonly<Record<string, unknown>>, key: string): Maybe<boolean> {
  const value = record[key];
  if (typeof value !== 'boolean') {
    return nothing();
  }
  return just(value);
}

export function readNumber(record: Readonly<Record<string, unknown>>, key: string): Maybe<number> {
  const value = record[key];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return nothing();
  }
  return just(value);
}
