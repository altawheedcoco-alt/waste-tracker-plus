import { useMemo } from 'react';

interface FuelRecord {
  id: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  fuel_date: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  odometer_reading?: number | null;
  station_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  km_since_last_fill?: number | null;
  l_per_100km?: number | null;
  fraud_flags?: any[];
}

// Standard consumption by vehicle type (L/100km)
const VEHICLE_STANDARDS: Record<string, number> = {
  truck_heavy: 35,
  truck_medium: 25,
  truck_light: 18,
  van: 14,
  pickup: 12,
  car: 10,
  default: 20,
};

export interface VehicleEfficiency {
  vehicleId: string;
  vehiclePlate?: string;
  avgLPer100km: number;
  standardLPer100km: number;
  deviationPercent: number;
  totalLiters: number;
  totalCost: number;
  totalKm: number;
  recordCount: number;
  efficiencyScore: number; // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface DriverEfficiency {
  driverId: string;
  driverName?: string;
  avgLPer100km: number;
  totalLiters: number;
  totalCost: number;
  recordCount: number;
  score: number;
}

export interface FraudAlert {
  recordId: string;
  type: 'overconsumption' | 'duplicate_fill' | 'location_mismatch' | 'odometer_rollback';
  severity: 'red' | 'yellow' | 'green';
  message: string;
  details: Record<string, any>;
}

export interface BudgetForecast {
  nextMonthLiters: number;
  nextMonthCost: number;
  confidence: number;
  trend: 'up' | 'stable' | 'down';
  monthlyHistory: { month: string; cost: number; liters: number }[];
}

export function useFuelCalculations(records: FuelRecord[]) {
  const vehicleEfficiencies = useMemo((): VehicleEfficiency[] => {
    const byVehicle = new Map<string, FuelRecord[]>();
    records.forEach(r => {
      if (!r.vehicle_id) return;
      const arr = byVehicle.get(r.vehicle_id) || [];
      arr.push(r);
      byVehicle.set(r.vehicle_id, arr);
    });

    return Array.from(byVehicle.entries()).map(([vehicleId, recs]) => {
      const sorted = [...recs].sort((a, b) => new Date(a.fuel_date).getTime() - new Date(b.fuel_date).getTime());
      let totalKm = 0;
      let segments = 0;

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].odometer_reading;
        const curr = sorted[i].odometer_reading;
        if (prev && curr && curr > prev) {
          totalKm += curr - prev;
          segments++;
        }
      }

      const totalLiters = recs.reduce((s, r) => s + r.liters, 0);
      const totalCost = recs.reduce((s, r) => s + (r.total_cost || 0), 0);
      const avgLPer100km = totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
      const standard = VEHICLE_STANDARDS.default;
      const deviation = standard > 0 ? ((avgLPer100km - standard) / standard) * 100 : 0;
      const efficiencyScore = Math.max(0, Math.min(100, 100 - Math.abs(deviation)));

      let status: VehicleEfficiency['status'] = 'excellent';
      if (deviation > 50) status = 'critical';
      else if (deviation > 30) status = 'warning';
      else if (deviation > 10) status = 'good';

      return {
        vehicleId,
        avgLPer100km: Math.round(avgLPer100km * 10) / 10,
        standardLPer100km: standard,
        deviationPercent: Math.round(deviation),
        totalLiters: Math.round(totalLiters),
        totalCost: Math.round(totalCost),
        totalKm: Math.round(totalKm),
        recordCount: recs.length,
        efficiencyScore: Math.round(efficiencyScore),
        status,
      };
    });
  }, [records]);

  const driverEfficiencies = useMemo((): DriverEfficiency[] => {
    const byDriver = new Map<string, FuelRecord[]>();
    records.forEach(r => {
      if (!r.driver_id) return;
      const arr = byDriver.get(r.driver_id) || [];
      arr.push(r);
      byDriver.set(r.driver_id, arr);
    });

    return Array.from(byDriver.entries()).map(([driverId, recs]) => {
      const totalLiters = recs.reduce((s, r) => s + r.liters, 0);
      const totalCost = recs.reduce((s, r) => s + (r.total_cost || 0), 0);
      let totalKm = 0;
      const sorted = [...recs].sort((a, b) => new Date(a.fuel_date).getTime() - new Date(b.fuel_date).getTime());
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].odometer_reading;
        const curr = sorted[i].odometer_reading;
        if (prev && curr && curr > prev) totalKm += curr - prev;
      }
      const avgLPer100km = totalKm > 0 ? (totalLiters / totalKm) * 100 : 0;
      const score = Math.max(0, Math.min(100, 100 - Math.abs(((avgLPer100km - 20) / 20) * 100)));

      return { driverId, avgLPer100km: Math.round(avgLPer100km * 10) / 10, totalLiters: Math.round(totalLiters), totalCost: Math.round(totalCost), recordCount: recs.length, score: Math.round(score) };
    }).sort((a, b) => b.score - a.score);
  }, [records]);

  const fraudAlerts = useMemo((): FraudAlert[] => {
    const alerts: FraudAlert[] = [];
    const sorted = [...records].sort((a, b) => new Date(a.fuel_date).getTime() - new Date(b.fuel_date).getTime());

    // Check overconsumption
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev.odometer_reading && curr.odometer_reading && prev.vehicle_id === curr.vehicle_id && curr.vehicle_id) {
        const km = curr.odometer_reading - prev.odometer_reading;
        if (km > 0) {
          const lPer100 = (curr.liters / km) * 100;
          const standard = VEHICLE_STANDARDS.default;
          if (lPer100 > standard * 1.5) {
            alerts.push({
              recordId: curr.id,
              type: 'overconsumption',
              severity: lPer100 > standard * 2 ? 'red' : 'yellow',
              message: `استهلاك مرتفع: ${lPer100.toFixed(1)} لتر/100كم (المعيار: ${standard})`,
              details: { actual: lPer100, standard, km, liters: curr.liters },
            });
          }
        }
        // Odometer rollback
        if (curr.odometer_reading < prev.odometer_reading) {
          alerts.push({
            recordId: curr.id,
            type: 'odometer_rollback',
            severity: 'red',
            message: `تراجع العداد: ${prev.odometer_reading} → ${curr.odometer_reading}`,
            details: { prev: prev.odometer_reading, curr: curr.odometer_reading },
          });
        }
      }
    }

    // Duplicate fills same day same driver
    const byDayDriver = new Map<string, FuelRecord[]>();
    records.forEach(r => {
      if (!r.driver_id) return;
      const key = `${r.fuel_date}_${r.driver_id}`;
      const arr = byDayDriver.get(key) || [];
      arr.push(r);
      byDayDriver.set(key, arr);
    });
    byDayDriver.forEach((recs, key) => {
      if (recs.length >= 2) {
        recs.forEach(r => {
          alerts.push({
            recordId: r.id,
            type: 'duplicate_fill',
            severity: 'yellow',
            message: `تعبئة مكررة: ${recs.length} مرات في يوم واحد`,
            details: { date: r.fuel_date, count: recs.length },
          });
        });
      }
    });

    return alerts;
  }, [records]);

  const budgetForecast = useMemo((): BudgetForecast => {
    const byMonth = new Map<string, { cost: number; liters: number }>();
    records.forEach(r => {
      const month = r.fuel_date.slice(0, 7);
      const entry = byMonth.get(month) || { cost: 0, liters: 0 };
      entry.cost += r.total_cost || 0;
      entry.liters += r.liters;
      byMonth.set(month, entry);
    });

    const history = Array.from(byMonth.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const last3 = history.slice(-3);
    const avgCost = last3.length > 0 ? last3.reduce((s, m) => s + m.cost, 0) / last3.length : 0;
    const avgLiters = last3.length > 0 ? last3.reduce((s, m) => s + m.liters, 0) / last3.length : 0;

    let trend: BudgetForecast['trend'] = 'stable';
    if (last3.length >= 2) {
      const diff = last3[last3.length - 1].cost - last3[0].cost;
      if (diff > avgCost * 0.1) trend = 'up';
      else if (diff < -avgCost * 0.1) trend = 'down';
    }

    return {
      nextMonthLiters: Math.round(avgLiters),
      nextMonthCost: Math.round(avgCost),
      confidence: Math.min(95, last3.length * 30),
      trend,
      monthlyHistory: history,
    };
  }, [records]);

  const summary = useMemo(() => {
    const totalLiters = records.reduce((s, r) => s + r.liters, 0);
    const totalCost = records.reduce((s, r) => s + (r.total_cost || 0), 0);
    const avgCostPerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;
    const bestDriver = driverEfficiencies[0];
    const worstDriver = driverEfficiencies[driverEfficiencies.length - 1];

    return {
      totalLiters: Math.round(totalLiters),
      totalCost: Math.round(totalCost),
      avgCostPerLiter: Math.round(avgCostPerLiter * 100) / 100,
      recordCount: records.length,
      alertCount: fraudAlerts.length,
      redAlerts: fraudAlerts.filter(a => a.severity === 'red').length,
      yellowAlerts: fraudAlerts.filter(a => a.severity === 'yellow').length,
      bestDriverId: bestDriver?.driverId,
      worstDriverId: worstDriver?.driverId,
    };
  }, [records, fraudAlerts, driverEfficiencies]);

  return {
    vehicleEfficiencies,
    driverEfficiencies,
    fraudAlerts,
    budgetForecast,
    summary,
  };
}
