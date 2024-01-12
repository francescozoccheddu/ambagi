import path from 'path';

export function pathToUrlPath(p: Str): Str {
  return path.posix.normalize(p.replaceAll(path.win32.sep, path.posix.sep));
}

export function joinUrl(a: Str, b: Str): Str {
  const fullUrl = new URL(pathToUrlPath(a));
  fullUrl.pathname = path.posix.join(fullUrl.pathname, pathToUrlPath(b));
  return fullUrl.toString();
}