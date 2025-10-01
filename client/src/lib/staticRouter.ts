import type { BaseLocationHook } from "wouter";

export function createStaticRouterHook(pathname: string): BaseLocationHook {
  const cleanPath = pathname || "/";
  const navigate = (..._args: any[]) => {};

  const hook: BaseLocationHook = () => [cleanPath, navigate];

  return hook;
}
