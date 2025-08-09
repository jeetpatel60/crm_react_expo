import { useEffect, useCallback } from 'react';
import { eventBus, EVENTS } from '../utils/eventBus';

/**
 * Custom hook to handle data refresh when database is restored
 * @param refreshCallback - Function to call when data needs to be refreshed
 * @param dependencies - Optional dependencies array for the refresh callback
 */
export const useDataRefresh = (
  refreshCallback: () => void | Promise<void>,
  dependencies: any[] = []
) => {
  const memoizedRefreshCallback = useCallback(refreshCallback, dependencies);

  useEffect(() => {
    // Listen for database restoration events
    const unsubscribeRestore = eventBus.on(EVENTS.DATABASE_RESTORED, async () => {
      console.log('Database restored, refreshing data...');
      try {
        await memoizedRefreshCallback();
      } catch (error) {
        console.error('Error refreshing data after database restore:', error);
      }
    });

    // Listen for general data refresh events
    const unsubscribeRefresh = eventBus.on(EVENTS.DATA_REFRESH_NEEDED, async () => {
      console.log('Data refresh needed, refreshing data...');
      try {
        await memoizedRefreshCallback();
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    });

    // Listen for force app refresh events
    const unsubscribeForce = eventBus.on(EVENTS.FORCE_APP_REFRESH, async () => {
      console.log('Force app refresh, refreshing data...');
      try {
        // Add a small delay before refreshing to ensure database is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        await memoizedRefreshCallback();
      } catch (error) {
        console.error('Error force refreshing data:', error);
      }
    });

    return () => {
      unsubscribeRestore();
      unsubscribeRefresh();
      unsubscribeForce();
    };
  }, [memoizedRefreshCallback]);
};

/**
 * Hook specifically for screens that need to reload data after database restore
 * @param loadDataFunction - Function that loads/reloads the screen's data
 */
export const useAutoRefreshOnRestore = (loadDataFunction: () => void | Promise<void>) => {
  useDataRefresh(loadDataFunction, []);
};
