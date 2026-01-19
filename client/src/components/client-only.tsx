import { useLayoutEffect, useState } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component that only renders children on the client side.
 * Useful for avoiding hydration mismatches with dynamic data like auth state.
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  // If we're rendering on the server, return children so marketing/public
  // pages are fully server-rendered (useEffect/useLayoutEffect never run on server).
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return <>{children}</>;
  }

  // If the root already contains HTML (SSR output), consider the component
  // effectively mounted for hydration purposes so the initial client render
  // matches the server HTML and avoids a hydration mismatch warning.
  const [hasMounted, setHasMounted] = useState(() => {
    try {
      const root = document.getElementById('root');
      return !!(root && root.innerHTML && root.innerHTML.trim().length > 0);
    } catch (_e) {
      return false;
    }
  });

  useLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
