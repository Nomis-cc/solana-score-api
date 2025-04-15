export function stringifyWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (_: string, value: unknown): unknown => {
    return typeof value === 'bigint' ? value.toString() : value;
  });
}
