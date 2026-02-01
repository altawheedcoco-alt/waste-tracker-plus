import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Location {
  lat: number;
  lng: number;
}

interface ShipmentWithLocations {
  id: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  driver_id: string | null;
  pickup_location?: Location | null;
  delivery_location?: Location | null;
}

// Configuration for geofence auto-status
const GEOFENCE_CONFIG = {
  // Radius in meters to trigger status change
  arrivalRadius: 200, // 200 meters from destination
  departureRadius: 500, // 500 meters from origin to mark as departed
  
  // Status transitions
  transitions: {
    // When driver arrives at pickup location
    atPickup: {
      from: ['new', 'approved', 'pending', 'registered'],
      to: 'collecting',
      message: 'تم وصول السائق لموقع الاستلام - بدء التجميع تلقائياً',
    },
    // When driver departs from pickup location
    departedPickup: {
      from: ['collecting', 'loading', 'weighing', 'weighed', 'picked_up'],
      to: 'in_transit',
      message: 'تم مغادرة موقع الاستلام - بدء النقل تلقائياً',
    },
    // When driver arrives at delivery location
    atDelivery: {
      from: ['in_transit', 'on_the_way', 'delivering'],
      to: 'delivered',
      message: 'تم الوصول لموقع التسليم - تم التسليم تلقائياً',
    },
  },
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Parse location from address (in real scenario, this would use geocoding)
const parseLocationFromAddress = async (address: string): Promise<Location | null> => {
  // Try to extract coordinates if they're embedded in the address
  const coordMatch = address.match(/(\d+\.?\d*),\s*(\d+\.?\d*)/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2]),
    };
  }
  
  // Use Nominatim for geocoding (free, no API key needed)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  return null;
};

export const useGeofenceAutoStatus = (
  shipment: ShipmentWithLocations | null,
  driverLocation: Location | null,
  enabled: boolean = true,
  onStatusUpdate?: () => void
) => {
  const { profile } = useAuth();
  const lastStatusChangeRef = useRef<string | null>(null);
  const pickupLocationRef = useRef<Location | null>(null);
  const deliveryLocationRef = useRef<Location | null>(null);

  // Fetch or parse locations
  useEffect(() => {
    if (!shipment) return;

    const fetchLocations = async () => {
      if (shipment.pickup_location) {
        pickupLocationRef.current = shipment.pickup_location;
      } else if (shipment.pickup_address) {
        pickupLocationRef.current = await parseLocationFromAddress(shipment.pickup_address);
      }

      if (shipment.delivery_location) {
        deliveryLocationRef.current = shipment.delivery_location;
      } else if (shipment.delivery_address) {
        deliveryLocationRef.current = await parseLocationFromAddress(shipment.delivery_address);
      }
    };

    fetchLocations();
  }, [shipment?.pickup_address, shipment?.delivery_address]);

  // Update shipment status
  const updateShipmentStatus = useCallback(async (newStatus: string, notes: string) => {
    if (!shipment || !profile?.id) return;

    // Prevent duplicate updates
    if (lastStatusChangeRef.current === newStatus) return;
    lastStatusChangeRef.current = newStatus;

    try {
      const updateData: Record<string, any> = { status: newStatus };
      
      // Add timestamp based on status
      if (newStatus === 'collecting') {
        updateData.collection_started_at = new Date().toISOString();
      } else if (newStatus === 'in_transit') {
        updateData.in_transit_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);

      if (error) throw error;

      // Log the auto status change
      await supabase.from('shipment_logs').insert({
        shipment_id: shipment.id,
        status: newStatus as any,
        notes: `[تلقائي - GPS] ${notes}`,
        changed_by: profile.id,
        latitude: driverLocation?.lat,
        longitude: driverLocation?.lng,
      });

      toast.success(notes, {
        icon: '🎯',
        description: 'تم التحديث تلقائياً بناءً على موقعك',
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error('Error auto-updating status:', error);
      lastStatusChangeRef.current = null; // Allow retry
    }
  }, [shipment, profile?.id, driverLocation, onStatusUpdate]);

  // Check geofences and trigger status changes
  const checkGeofences = useCallback(() => {
    if (!enabled || !shipment || !driverLocation) return;

    const pickupLocation = pickupLocationRef.current;
    const deliveryLocation = deliveryLocationRef.current;
    const currentStatus = shipment.status;

    // Check arrival at pickup
    if (pickupLocation) {
      const distanceToPickup = calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        pickupLocation.lat,
        pickupLocation.lng
      );

      const atPickupTransition = GEOFENCE_CONFIG.transitions.atPickup;
      if (
        distanceToPickup <= GEOFENCE_CONFIG.arrivalRadius &&
        atPickupTransition.from.includes(currentStatus)
      ) {
        updateShipmentStatus(atPickupTransition.to, atPickupTransition.message);
        return;
      }

      // Check departure from pickup
      const departedTransition = GEOFENCE_CONFIG.transitions.departedPickup;
      if (
        distanceToPickup >= GEOFENCE_CONFIG.departureRadius &&
        departedTransition.from.includes(currentStatus)
      ) {
        updateShipmentStatus(departedTransition.to, departedTransition.message);
        return;
      }
    }

    // Check arrival at delivery
    if (deliveryLocation) {
      const distanceToDelivery = calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        deliveryLocation.lat,
        deliveryLocation.lng
      );

      const atDeliveryTransition = GEOFENCE_CONFIG.transitions.atDelivery;
      if (
        distanceToDelivery <= GEOFENCE_CONFIG.arrivalRadius &&
        atDeliveryTransition.from.includes(currentStatus)
      ) {
        updateShipmentStatus(atDeliveryTransition.to, atDeliveryTransition.message);
        return;
      }
    }
  }, [enabled, shipment, driverLocation, updateShipmentStatus]);

  // Run geofence check when driver location updates
  useEffect(() => {
    if (enabled && driverLocation) {
      checkGeofences();
    }
  }, [driverLocation, checkGeofences, enabled]);

  // Reset when shipment changes
  useEffect(() => {
    lastStatusChangeRef.current = null;
  }, [shipment?.id]);

  return {
    checkGeofences,
    pickupLocation: pickupLocationRef.current,
    deliveryLocation: deliveryLocationRef.current,
    config: GEOFENCE_CONFIG,
  };
};

export default useGeofenceAutoStatus;
