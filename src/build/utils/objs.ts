import { toObj } from '@francescozoccheddu/ts-goodies/arrays';
import { toArr } from '@francescozoccheddu/ts-goodies/objects';

export async function mapObjValuesAsync<TK extends AnyKey, TV, TV2>(obj: RObj<TK, TV>, map: (file: TV) => Promise<TV2>): Promise<RObj<TK, TV2>> {
  return toObj(await Promise.all(toArr(obj).map(async ([k, v]) => [k, await (map(v))])));
}

export function pick<T extends Obj, TK extends keyof T>(obj: T, keys: RArr<TK>): Pick<T, TK> {
  const obj2: Obj = {};
  for (const key of keys) {
    obj2[key] = obj[key];
  }
  return obj2 as Pick<T, TK>;
}