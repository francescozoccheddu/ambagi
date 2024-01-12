
export type Route = R<{
  from: Str;
  to: Str;
}>

export function buildRoutes(routes: RArr<Route>): Str {
  return routes.map(r => `${r.from} ${r.to}`).join('\n');
}