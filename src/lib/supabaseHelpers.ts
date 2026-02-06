/**
 * Helper functions to normalize Supabase query results
 * When foreign key constraints are removed, Supabase returns arrays instead of single objects
 */

/**
 * Normalize a relation that might be an array or single object
 * Returns the first element if array, or the value itself if object/null
 */
export function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }
  return value;
}

/**
 * Normalize all organization relations in a shipment object
 */
export function normalizeShipment<T extends {
  generator?: any;
  transporter?: any;
  recycler?: any;
  driver?: any;
}>(shipment: T): T {
  return {
    ...shipment,
    generator: normalizeRelation(shipment.generator),
    transporter: normalizeRelation(shipment.transporter),
    recycler: normalizeRelation(shipment.recycler),
    driver: normalizeRelation(shipment.driver),
  };
}

/**
 * Normalize an array of shipments
 */
export function normalizeShipments<T extends {
  generator?: any;
  transporter?: any;
  recycler?: any;
  driver?: any;
}>(shipments: T[]): T[] {
  return shipments.map(normalizeShipment);
}

/**
 * Normalize a recycling report with nested shipment
 */
export function normalizeRecyclingReport<T extends {
  shipment?: any;
  recycler_organization?: any;
}>(report: T): T {
  return {
    ...report,
    shipment: report.shipment ? normalizeShipment(report.shipment) : null,
    recycler_organization: normalizeRelation(report.recycler_organization),
  };
}

/**
 * Normalize notification with related shipment
 */
export function normalizeNotification<T extends {
  shipment?: any;
}>(notification: T): T {
  return {
    ...notification,
    shipment: notification.shipment ? normalizeShipment(notification.shipment) : null,
  };
}
