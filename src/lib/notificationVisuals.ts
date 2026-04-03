/**
 * Centralized notification visuals — icons, colors, badges
 * Driven entirely by NOTIFICATION_TYPES_REGISTRY categories.
 * Every notification type is covered via its category.
 */

import {
  Bell, Package, Truck, CheckCircle, AlertCircle, Info, FileText, Send,
  MessageSquare, Wallet, Handshake, BarChart3, Shield, Stamp, Sparkles,
  AlertTriangle, Leaf, ClipboardCheck, UserCheck, Key, Settings,
  MessageCircle, Car, PenTool, Wrench, Gavel, Megaphone, Radar,
  Users, Phone, Video, Film, Heart, Image, BookOpen, Siren, Scale,
  Globe, ShoppingCart, Briefcase, GraduationCap, Flame, Lock, Eye,
  Zap, Timer, Flag, TrendingUp, Fuel, type LucideIcon,
} from 'lucide-react';
import { NotificationCategory, getNotificationTypeMeta } from './notificationTypes';

// ═══════════════════════════════════════════════════════
// Per-type icon overrides (most specific types get unique icons)
// ═══════════════════════════════════════════════════════
const TYPE_ICON_MAP: Record<string, LucideIcon> = {
  // Shipments
  shipment_created: Package, new_shipment: Package, shipment_offer: Package,
  shipment_status: Truck, status_update: Truck, shipment_status_change: Truck, shipment_update: Truck,
  shipment_assigned: Truck, driver_assignment: Car, driver_reassigned: Car,
  shipment_approved: CheckCircle, shipment_auto_approved: CheckCircle, shipment_confirmed: CheckCircle,
  shipment_delivered: CheckCircle, delivery_confirmed: CheckCircle,
  shipment_delayed: Timer, shipment_rejected: AlertCircle, shipment_cancelled: AlertCircle,
  shipment_disputed: Gavel, weight_mismatch: Scale,
  pickup_started: Truck, pickup_completed: CheckCircle,
  delivery_started: Truck, delivery_eta_update: Timer,
  collection_request: Package, collection_trip_assigned: Truck, collection_trip_status: Truck,
  scheduled_collection: Timer, proof_of_service: FileText, loading_worker: Users,
  recycler_timeslot: Timer,

  // Custody
  custody_generator_handover: Package, custody_transporter_pickup: Truck,
  custody_transporter_delivery: Truck, custody_recycler_receipt: CheckCircle,
  custody_chain_complete: CheckCircle,

  // Fleet
  signal_lost: AlertCircle, fleet_alert: Car, maintenance: Wrench,
  geofence_alert: Radar, gps_alert: Radar, route_deviation: Radar,
  speed_alert: Zap, eta_alert: Timer, fake_gps: Lock, fake_gps_detected: Lock,
  vehicle_inspection_due: Wrench, fuel_alert: Fuel, driver_rest_violation: AlertTriangle,
  iot_alert: Radar, fuel_request: Fuel, fuel_approved: CheckCircle, fuel_rejected: AlertCircle,
  fuel_consumption: Fuel, fuel_anomaly: AlertTriangle, fuel_report: BarChart3,

  // Documents
  signing_request: PenTool, signature_request: PenTool,
  document_uploaded: FileText, document_issued: Send, document_signed: PenTool,
  document_shared: FileText, stamp_applied: Stamp, document_expired: AlertTriangle,
  document_rejected: AlertCircle, document_download: FileText,
  endorsement_complete: CheckCircle, endorsement_notes: FileText,
  government_doc_issued: FileText, document_signature: PenTool,
  signature_rejected: AlertCircle, signing_rejected: AlertCircle,

  // Certificates
  receipt_issued: FileText, receipt_confirmed: CheckCircle, certificate: BarChart3,
  recycling_report: BarChart3, report: BarChart3, recycling_certificate_issued: BarChart3,
  aggregate_report_shared: BarChart3, disposal_byproduct: BarChart3,
  disposal_certificate: BarChart3, production_batch_new: Package,
  recycling_report_generator: BarChart3,

  // Finance
  invoice: Wallet, invoice_overdue: AlertTriangle, invoice_created: Wallet,
  invoice_paid: CheckCircle, invoice_draft: FileText, payment: Wallet,
  payment_received: Wallet, deposit: Wallet, wallet_deposit: Wallet,
  financial: Wallet, financial_report: BarChart3, low_margin_alert: AlertTriangle,
  escrow_released: Wallet, escrow_held: Lock, subscription_reminder: Timer,
  subscription_expired: AlertCircle, wallet: Wallet, wallet_transaction: Wallet,
  counter_offer: Wallet, contract_penalty: AlertTriangle,
  invoice_reminder: AlertTriangle, subscription_renewed: CheckCircle,

  // Contracts
  contract_expiry: AlertTriangle, contract_created: FileText, contract_signed: PenTool,
  contract_renewed: CheckCircle, contract_terminated: AlertCircle,
  contract_pending_signature: PenTool, contract_update: FileText,
  municipal_contract: FileText, partner_contract: FileText,

  // Chat
  chat_message: MessageCircle, partner_message: MessageCircle, mention: Users,
  message: MessageCircle, group_message: MessageSquare, channel_message: Megaphone,
  thread_reply: MessageCircle, reaction_added: Heart, pinned_message: Flag,
  scheduled_message_sent: Timer, customer_conversation: MessageCircle,

  // Broadcast
  broadcast: Megaphone, broadcast_new_post: Megaphone, channel_created: Megaphone,
  channel_invitation: Megaphone, poll_created: BarChart3, poll_ended: BarChart3,

  // Meetings
  meeting_invitation: Phone, meeting_starting: Video, meeting_cancelled: AlertCircle,
  video_call_incoming: Video, call_missed: Phone,

  // Social
  partner_post: Heart, new_post: Heart, post_liked: Heart, post_commented: MessageCircle,
  post_shared: Users, story_posted: Image, reel_posted: Film,
  reel_liked: Heart, reel_commented: MessageCircle, member_post: Heart,
  story_reaction: Heart, profile_photo_updated: Image, cover_photo_updated: Image,
  announcement: Megaphone, news_published: Globe, partner_note: FileText,

  // Partners
  partner_linked: Handshake, partnership_request: Handshake, partnership_accepted: CheckCircle,
  partnership_rejected: AlertCircle, partnership_suspended: AlertTriangle,
  partner_rated: TrendingUp, partner_review: Eye, partner_verified: CheckCircle,
  partner_link: Handshake, partner_unlinked: AlertCircle, partner_document: FileText,

  // Members
  member_joined: Users, member_left: AlertCircle, member_role_changed: Key,
  employee_invitation: Users, employee_activated: CheckCircle, employee_deactivated: AlertCircle,
  delegation_created: FileText, delegation_expired: AlertTriangle,
  credentials_updated: Key, password_changed: Lock, permissions_updated: Key,
  member_invitation_sent: Send, member_invitation_accepted: CheckCircle,
  member_status_admin: Users, member_removed: AlertCircle, employee_update: Users,

  // HR
  leave_request: BookOpen, leave_approved: CheckCircle, leave_rejected: AlertCircle,
  salary_processed: Wallet, attendance_alert: Timer, shift_assigned: Timer,
  performance_review: TrendingUp, training_assigned: GraduationCap,
  daily_attendance: Timer, hr_request: BookOpen, job_title_updated: Briefcase,
  employee_document_uploaded: FileText, recruitment_application: Users,
  interview_scheduled: Phone, training_completed: GraduationCap,
  certification_earned: GraduationCap, academy_progress: GraduationCap,

  // Compliance
  license_expiry: Key, license_warning: AlertTriangle, compliance_alert: Shield,
  compliance_update: Shield, inspection: Gavel, violation: Gavel,
  penalty_issued: Gavel, suspension_notice: AlertCircle, regulatory_update: Globe,
  audit_scheduled: ClipboardCheck, sla_violation: AlertTriangle, corrective_action: Wrench,
  audit_session: ClipboardCheck, compliance_doc_admin: FileText, consultant_review: Eye,
  safety_inspection: Shield, citizen_complaint: AlertTriangle, complaint_status: Info,

  // Drivers
  driver_notification: Car, driver_sos: Siren, driver_license_expiry: Key,
  driver_registered: Users, driver_approved: CheckCircle, driver_rejected: AlertCircle,
  driver_offer_received: Package, driver_offer_expired: Timer,
  driver_emergency: Siren, driver_emergency_admin: Siren,
  driver_alert_admin: AlertTriangle, driver_online: Zap,
  driver_rating: TrendingUp, driver_financial: Wallet, earning: Wallet,

  // Environment
  carbon_report: Leaf, environmental: Leaf, emission_threshold: AlertTriangle,
  esg_report_ready: BarChart3, sustainability_milestone: TrendingUp,
  carbon_credit: Leaf, esg_score_update: TrendingUp, esg_alert: AlertTriangle,
  carbon_offset: Leaf, sustainability_report: BarChart3,

  // Work orders
  work_order: ClipboardCheck, work_order_update: ClipboardCheck,
  work_order_completed: CheckCircle, work_order_assigned: ClipboardCheck,
  work_order_cancelled: AlertCircle, work_order_overdue: AlertTriangle,
  operational_plan: ClipboardCheck, task_assigned: ClipboardCheck, task_completed: CheckCircle,

  // Security
  security_alert: Shield, suspicious_login: Lock, account_locked: Lock,
  data_breach_alert: Siren, fraud_alert: Siren, transport_incident: Siren,

  // AI
  ai_alert: Sparkles, ai_insight: Sparkles, ai_analysis_complete: Sparkles,
  smart_dispatch: Sparkles, copilot_task: Sparkles,

  // Identity
  identity_verified: UserCheck, kyc_update: UserCheck, org_verified: CheckCircle,
  account_approved: CheckCircle,

  // Disputes
  weight_dispute: Scale, dispute_resolved: CheckCircle,
  dispute_escalated: AlertTriangle, dispute_created: Gavel,

  // Marketplace
  bid_received: ShoppingCart, bid_accepted: CheckCircle, auction_ending: Timer,
  marketplace_listing: ShoppingCart, auction_bid: ShoppingCart,
  auction_status: Info, marketplace_bid: ShoppingCart, waste_auction: ShoppingCart,

  // Emergency
  emergency: Siren, crisis_incident: Siren,

  // System
  approval_request: ClipboardCheck, approval_granted: CheckCircle, approval_denied: AlertCircle,
  system_maintenance: Settings, warning: AlertTriangle, system: Settings,
  action: Zap, reminder: Timer, data_sync: Settings, backup_complete: CheckCircle,
  import_complete: CheckCircle, wmis_event: Info,
  support_ticket: MessageSquare, support_ticket_status: Info,
  ad_approved: CheckCircle, ad_rejected: AlertCircle, ad_expired: Timer,
  call_center_queue: Phone, call_center_missed: Phone,
  call_recording_ready: Phone, agent_performance_alert: TrendingUp,
};

// ═══════════════════════════════════════════════════════
// Category → fallback icon, color, bg
// ═══════════════════════════════════════════════════════
interface CategoryVisual {
  icon: LucideIcon;
  color: string;   // text-* class
  bgColor: string; // bg-* class
}

export const CATEGORY_VISUALS: Record<NotificationCategory | 'other', CategoryVisual> = {
  shipments:    { icon: Truck,          color: 'text-blue-500',    bgColor: 'bg-blue-500/10' },
  custody:      { icon: Package,        color: 'text-indigo-500',  bgColor: 'bg-indigo-500/10' },
  fleet:        { icon: Car,            color: 'text-slate-500',   bgColor: 'bg-slate-500/10' },
  documents:    { icon: FileText,       color: 'text-indigo-500',  bgColor: 'bg-indigo-500/10' },
  certificates: { icon: BarChart3,      color: 'text-cyan-500',    bgColor: 'bg-cyan-500/10' },
  finance:      { icon: Wallet,         color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  contracts:    { icon: FileText,       color: 'text-teal-500',    bgColor: 'bg-teal-500/10' },
  chat:         { icon: MessageCircle,  color: 'text-pink-500',    bgColor: 'bg-pink-500/10' },
  broadcast:    { icon: Megaphone,      color: 'text-violet-500',  bgColor: 'bg-violet-500/10' },
  meetings:     { icon: Video,          color: 'text-sky-500',     bgColor: 'bg-sky-500/10' },
  social:       { icon: Heart,          color: 'text-rose-500',    bgColor: 'bg-rose-500/10' },
  partners:     { icon: Handshake,      color: 'text-purple-500',  bgColor: 'bg-purple-500/10' },
  members:      { icon: Users,          color: 'text-blue-600',    bgColor: 'bg-blue-600/10' },
  hr:           { icon: Briefcase,      color: 'text-amber-600',   bgColor: 'bg-amber-500/10' },
  compliance:   { icon: Shield,         color: 'text-violet-500',  bgColor: 'bg-violet-500/10' },
  drivers:      { icon: Car,            color: 'text-orange-500',  bgColor: 'bg-orange-500/10' },
  environment:  { icon: Leaf,           color: 'text-lime-600',    bgColor: 'bg-lime-500/10' },
  work_orders:  { icon: ClipboardCheck, color: 'text-sky-500',     bgColor: 'bg-sky-500/10' },
  security:     { icon: Shield,         color: 'text-red-600',     bgColor: 'bg-red-500/10' },
  ai:           { icon: Sparkles,       color: 'text-fuchsia-500', bgColor: 'bg-fuchsia-500/10' },
  identity:     { icon: UserCheck,      color: 'text-teal-600',    bgColor: 'bg-teal-500/10' },
  disputes:     { icon: Gavel,          color: 'text-orange-600',  bgColor: 'bg-orange-500/10' },
  marketplace:  { icon: ShoppingCart,   color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
  system:       { icon: Settings,       color: 'text-gray-500',    bgColor: 'bg-gray-500/10' },
  emergency:    { icon: Siren,          color: 'text-red-500',     bgColor: 'bg-red-500/10' },
  other:        { icon: Info,           color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

// ═══════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════

/** Get the icon for a notification type */
export function getNotificationIcon(type: string | null): LucideIcon {
  if (!type) return Bell;
  if (TYPE_ICON_MAP[type]) return TYPE_ICON_MAP[type];
  const meta = getNotificationTypeMeta(type);
  if (meta) return CATEGORY_VISUALS[meta.category]?.icon || Bell;
  return Bell;
}

/** Get icon color class */
export function getNotificationIconColor(type: string | null): string {
  if (!type) return 'bg-muted text-muted-foreground';
  const meta = getNotificationTypeMeta(type);
  if (meta) {
    const v = CATEGORY_VISUALS[meta.category];
    return `${v.bgColor} ${v.color}`;
  }
  return 'bg-muted text-muted-foreground';
}

/** Get the category for a notification (uses registry) */
export function categorizeNotification(type: string | null): NotificationCategory | 'other' {
  if (!type) return 'other';
  const meta = getNotificationTypeMeta(type);
  return meta?.category || 'other';
}

/** Get badge info */
export function getNotificationBadgeInfo(type: string | null): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (!type) return { label: 'إشعار', variant: 'outline' };
  const meta = getNotificationTypeMeta(type);
  if (!meta) return { label: 'إشعار', variant: 'outline' };
  
  // Determine variant from priority
  const variant: 'default' | 'secondary' | 'destructive' | 'outline' = 
    meta.defaultPriority === 'urgent' ? 'destructive' :
    meta.defaultPriority === 'high' ? 'default' :
    meta.defaultPriority === 'low' ? 'outline' : 'secondary';
  
  return { label: meta.labelAr, variant };
}

/** Category labels for tabs — includes all 24 categories + "all" + "other" */
export const NOTIFICATION_TAB_CATEGORIES: {
  id: NotificationCategory | 'all' | 'other';
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}[] = [
  { id: 'all', label: 'الكل', icon: Bell, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'shipments', label: 'الشحنات', ...CATEGORY_VISUALS.shipments },
  { id: 'custody', label: 'سلسلة الحيازة', ...CATEGORY_VISUALS.custody },
  { id: 'fleet', label: 'الأسطول والتتبع', ...CATEGORY_VISUALS.fleet },
  { id: 'drivers', label: 'السائقون', ...CATEGORY_VISUALS.drivers },
  { id: 'documents', label: 'المستندات', ...CATEGORY_VISUALS.documents },
  { id: 'certificates', label: 'الشهادات والتقارير', ...CATEGORY_VISUALS.certificates },
  { id: 'finance', label: 'المالية', ...CATEGORY_VISUALS.finance },
  { id: 'contracts', label: 'العقود', ...CATEGORY_VISUALS.contracts },
  { id: 'chat', label: 'الرسائل', ...CATEGORY_VISUALS.chat },
  { id: 'broadcast', label: 'البث والقنوات', ...CATEGORY_VISUALS.broadcast },
  { id: 'meetings', label: 'الاجتماعات', ...CATEGORY_VISUALS.meetings },
  { id: 'social', label: 'المنشورات والقصص', ...CATEGORY_VISUALS.social },
  { id: 'partners', label: 'الشركاء', ...CATEGORY_VISUALS.partners },
  { id: 'members', label: 'الأعضاء', ...CATEGORY_VISUALS.members },
  { id: 'hr', label: 'الموارد البشرية', ...CATEGORY_VISUALS.hr },
  { id: 'work_orders', label: 'أوامر العمل', ...CATEGORY_VISUALS.work_orders },
  { id: 'compliance', label: 'الامتثال', ...CATEGORY_VISUALS.compliance },
  { id: 'environment', label: 'البيئة والكربون', ...CATEGORY_VISUALS.environment },
  { id: 'marketplace', label: 'السوق والمزايدات', ...CATEGORY_VISUALS.marketplace },
  { id: 'disputes', label: 'النزاعات', ...CATEGORY_VISUALS.disputes },
  { id: 'security', label: 'الأمن', ...CATEGORY_VISUALS.security },
  { id: 'emergency', label: 'الطوارئ', ...CATEGORY_VISUALS.emergency },
  { id: 'ai', label: 'الذكاء الاصطناعي', ...CATEGORY_VISUALS.ai },
  { id: 'identity', label: 'التحقق والهوية', ...CATEGORY_VISUALS.identity },
  { id: 'system', label: 'النظام', ...CATEGORY_VISUALS.system },
  { id: 'other', label: 'أخرى', ...CATEGORY_VISUALS.other },
];
