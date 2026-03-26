import { memo } from 'react';
import ShipmentCard from './cards/ShipmentCard';
import InvoiceCard from './cards/InvoiceCard';
import SigningRequestCard from './cards/SigningRequestCard';
import DocumentCard from './cards/DocumentCard';
import ContractCard from './cards/ContractCard';
import AwardLetterCard from './cards/AwardLetterCard';
import WorkOrderCard from './cards/WorkOrderCard';
import BulkResourcesCard from './cards/BulkResourcesCard';

interface CardRendererProps {
  resourceType: string;
  resourceData: any;
  isOwn: boolean;
  orgType?: string;
  onAction?: (action: string, id: string, data?: any) => void;
}

const ChatMessageCardRenderer = memo(({ resourceType, resourceData, isOwn, orgType, onAction }: CardRendererProps) => {
  if (!resourceData) return null;

  switch (resourceType) {
    case 'shipment':
    case 'tracking':
      return <ShipmentCard data={resourceData} isOwn={isOwn} compact={resourceType === 'tracking'} orgType={orgType} onAction={onAction} />;
    case 'invoice':
      return <InvoiceCard data={resourceData} isOwn={isOwn} onAction={onAction} />;
    case 'signing_request':
    case 'sign':
    case 'stamp':
      return <SigningRequestCard data={resourceData} isOwn={isOwn} onAction={onAction} />;
    case 'document':
    case 'doc':
      return <DocumentCard data={resourceData} isOwn={isOwn} onAction={onAction} />;
    case 'contract':
      return <ContractCard data={resourceData} isOwn={isOwn} onAction={onAction} />;
    case 'award_letter':
      return <AwardLetterCard data={resourceData} isOwn={isOwn} />;
    case 'work_order':
      return <WorkOrderCard data={resourceData} isOwn={isOwn} />;
    case 'bulk_resources':
      return <BulkResourcesCard data={resourceData} isOwn={isOwn} />;
    default:
      return null;
  }
});

ChatMessageCardRenderer.displayName = 'ChatMessageCardRenderer';
export default ChatMessageCardRenderer;
