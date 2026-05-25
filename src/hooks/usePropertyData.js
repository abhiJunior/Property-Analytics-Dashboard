import { useMemo } from 'react';
import properties from '../properties.json';

/**
 * Custom React hook to filter and compute property tax analytics.
 *
 * @param {string} selectedTenant - The selected city/tenant filter. "All Cities" represents no filter.
 * @param {Array} customProperties - Custom properties created by the user during the session.
 * @returns {Object} The computed properties data and analytics:
 *   - filteredData: Array of properties matching the filter.
 *   - totalRegistered: Count of properties matching the filter.
 *   - totalApproved: Count of approved properties matching the filter.
 *   - totalRejected: Count of rejected properties matching the filter.
 *   - totalCollection: Sum of collection_inr for properties matching the filter.
 *   - allCities: Sorted array of all unique tenant names.
 *   - cityStats: Aggregated statistics per city computed from ALL data.
 */
export function usePropertyData(selectedTenant, customProperties = []) {
  // Merge static properties with user-created custom properties
  const mergedProperties = useMemo(() => {
    return [...customProperties, ...properties];
  }, [customProperties]);

  // 1. Get the list of all unique cities/tenants from the dataset.
  const allCities = useMemo(() => {
    const cities = mergedProperties.map((p) => p.tenant);
    return [...new Set(cities)].sort();
  }, [mergedProperties]);

  // 2. Compute aggregated statistics per city from the entire dataset (regardless of filter).
  const cityStats = useMemo(() => {
    const statsMap = {};

    mergedProperties.forEach((p) => {
      const city = p.tenant;
      if (!statsMap[city]) {
        statsMap[city] = {
          city,
          registered: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          totalCollection: 0,
        };
      }

      const stats = statsMap[city];
      stats.registered += 1;

      if (p.status === 'Approved') {
        stats.approved += 1;
      } else if (p.status === 'Rejected') {
        stats.rejected += 1;
      } else if (p.status === 'Pending') {
        stats.pending += 1;
      }

      stats.totalCollection += Number(p.collection_inr) || 0;
    });

    return Object.values(statsMap);
  }, [mergedProperties]);

  // 3. Filter the property data based on the selected tenant.
  const filteredData = useMemo(() => {
    if (!selectedTenant || selectedTenant === 'All Cities') {
      return mergedProperties;
    }
    return mergedProperties.filter((p) => p.tenant === selectedTenant);
  }, [mergedProperties, selectedTenant]);

  // 4. Compute metrics for the filtered subset.
  const metrics = useMemo(() => {
    let approved = 0;
    let rejected = 0;
    let pending = 0;
    let collection = 0;

    filteredData.forEach((p) => {
      if (p.status === 'Approved') approved += 1;
      else if (p.status === 'Rejected') rejected += 1;
      else if (p.status === 'Pending') pending += 1;
      collection += Number(p.collection_inr) || 0;
    });

    return {
      totalRegistered: filteredData.length,
      totalApproved: approved,
      totalRejected: rejected,
      totalPending: pending,
      totalCollection: collection,
    };
  }, [filteredData]);

  return {
    filteredData,
    allCities,
    cityStats,
    ...metrics,
  };
}

export default usePropertyData;
