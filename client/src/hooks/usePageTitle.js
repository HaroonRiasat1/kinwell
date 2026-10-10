import { useEffect } from 'react';

export const SITE_TITLE = 'Kinwell · Home nutrition care for parents in Lahore';

/** Sets the browser tab title while a page is shown ("Sign in · Kinwell"), and restores it after. */
export function usePageTitle(title) {
  useEffect(() => {
    const before = document.title;
    document.title = title ? `${title} · Kinwell` : SITE_TITLE;
    return () => {
      document.title = before;
    };
  }, [title]);
}
