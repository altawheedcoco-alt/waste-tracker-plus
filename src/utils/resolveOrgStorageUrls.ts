/**
 * Resolves private storage URLs (stamp_url, signature_url) for organization objects.
 * Converts raw Supabase storage paths to signed URLs for private buckets.
 */
import { refreshStorageUrl } from '@/utils/storageUrl';

interface OrgWithUrls {
  stamp_url?: string | null;
  signature_url?: string | null;
  [key: string]: any;
}

/**
 * Resolve stamp_url and signature_url for a single org object.
 * Returns a new object with resolved URLs.
 */
export const resolveOrgUrls = async <T extends OrgWithUrls>(org: T | null | undefined): Promise<T | null | undefined> => {
  if (!org) return org;

  const [resolvedStamp, resolvedSignature] = await Promise.all([
    org.stamp_url ? refreshStorageUrl(org.stamp_url) : Promise.resolve(org.stamp_url),
    org.signature_url ? refreshStorageUrl(org.signature_url) : Promise.resolve(org.signature_url),
  ]);

  return {
    ...org,
    stamp_url: resolvedStamp,
    signature_url: resolvedSignature,
  };
};

/**
 * Resolve URLs for generator, transporter, and recycler in a shipment object.
 * Returns a new shipment object with all org URLs resolved.
 */
export const resolveShipmentOrgUrls = async <T extends {
  generator?: OrgWithUrls | null;
  transporter?: OrgWithUrls | null;
  recycler?: OrgWithUrls | null;
}>(shipment: T): Promise<T> => {
  const [generator, transporter, recycler] = await Promise.all([
    resolveOrgUrls(shipment.generator),
    resolveOrgUrls(shipment.transporter),
    resolveOrgUrls(shipment.recycler),
  ]);

  return {
    ...shipment,
    generator,
    transporter,
    recycler,
  };
};
