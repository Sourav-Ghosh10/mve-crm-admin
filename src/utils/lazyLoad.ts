import { lazy, type ComponentType } from 'react';

/**
 * A helper to wrap React.lazy with retry logic for dynamic imports.
 * This handles the "Failed to fetch dynamically imported module" error
 * which often occurs when a new version is deployed or the dev server restarts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyLoad = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
    return lazy(async () => {
        try {
            const component = await importFn();
            // Clear the refreshed flag on success, as this means we've successfully loaded a chunk
            // and can handle a potential future refresh if another update happens later.
            sessionStorage.removeItem('page-refreshed-on-error');
            return component;
        } catch (error) {
            console.error('Dynamic import failed. This usually happens after a new deployment.', error);

            // Check if we've already tried to reload the page in this session
            const hasRefreshed = sessionStorage.getItem('page-refreshed-on-error');

            if (!hasRefreshed) {
                sessionStorage.setItem('page-refreshed-on-error', 'true');
                console.info('Force refreshing to load latest application version...');

                // Add a timestamp to bypass cache
                const url = new URL(window.location.href);
                url.searchParams.set('u', Date.now().toString());
                window.location.replace(url.toString());

                return new Promise(() => { });
            }

            // If we already refreshed once and it still fails, throw the error
            throw error;
        }
    });
};
