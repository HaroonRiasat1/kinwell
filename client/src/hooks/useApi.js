import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader on mount and whenever `deps` change.
 * Returns { data, error, loading, reload, setData } — setData allows optimistic updates.
 */
export function useApi(loader, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const latest = useRef(0);

  const run = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === latest.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === latest.current) setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);
  return { ...state, reload: run, setData };
}
