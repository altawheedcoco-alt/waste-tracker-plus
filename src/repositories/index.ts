// Base Repository
export { BaseRepository, type QueryOptions, type PaginatedResult } from './BaseRepository';

// Domain Repositories
export { ShipmentsRepository, type Shipment, type ShipmentFilters } from './ShipmentsRepository';
export { ContractsRepository, type Contract, type ContractFilters } from './ContractsRepository';
export { PartnersRepository, type Partner, type PartnerRelation } from './PartnersRepository';
export { DriversRepository, type Driver, type DriverLocation } from './DriversRepository';
export { NotificationsRepository, type Notification } from './NotificationsRepository';
export { InvoicesRepository, type Invoice, type InvoiceFilters } from './InvoicesRepository';

// Re-export for convenience
export type { 
  Shipment as ShipmentEntity,
  Contract as ContractEntity,
  Partner as PartnerEntity,
  Driver as DriverEntity,
  Invoice as InvoiceEntity,
} from './index';
