/**
 * نظام الأولويات الذكي الموحد - Smart Priority Engine
 * يحدد ترتيب الودجات ديناميكياً حسب: نوع الجهة + دور المستخدم + البيانات الحية
 */

/** وزن الأولوية لودجت معين */
export interface PriorityWeight {
  widgetId: string;
  /** الوزن الأساسي (0-100): أعلى = أهم */
  baseWeight: number;
  /** الودجت يطلع أولاً لو في بيانات حية تستدعي الانتباه */
  liveBoostConditions?: LiveBoostCondition[];
}

/** شرط رفع الأولوية بناءً على بيانات حية */
export interface LiveBoostCondition {
  /** معرف فريد */
  id: string;
  /** وصف عربي */
  labelAr: string;
  /** اسم الجدول */
  table: string;
  /** الفلتر */
  filter: Record<string, string>;
  /** نوع التحقق */
  checkType: 'count_above' | 'exists' | 'overdue';
  /** القيمة المرجعية */
  threshold?: number;
  /** مقدار الزيادة في الوزن */
  boostAmount: number;
}

/** أولويات كيان واحد (جهة أو سائق أو مدير) */
export interface OrgPriorityProfile {
  /** نوع الكيان — السائق كيان مستقل وليس جهة */
  orgType: string;
  labelAr: string;
  /** الودجات مرتبة حسب الأولوية الافتراضية */
  priorities: PriorityWeight[];
  /** أولويات مخصصة حسب الدور */
  roleOverrides?: Record<string, PriorityWeight[]>;
}

// ═══════════════════════════════════════════════
// خرائط الأولويات لكل الجهات
// ═══════════════════════════════════════════════

export const PRIORITY_PROFILES: Record<string, OrgPriorityProfile> = {
  // ─── المولّد (Generator) ───
  generator: {
    orgType: 'generator',
    labelAr: 'المولّد',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'quick_actions', baseWeight: 95 },
      { widgetId: 'kpi_cards', baseWeight: 90 },
      { widgetId: 'pending_approvals', baseWeight: 85, liveBoostConditions: [
        { id: 'pending-approvals', labelAr: 'موافقات معلقة', table: 'approval_requests', filter: { status: 'pending' }, checkType: 'count_above', threshold: 0, boostAmount: 20 },
      ]},
      { widgetId: 'recent_shipments', baseWeight: 80, liveBoostConditions: [
        { id: 'active-shipments', labelAr: 'شحنات نشطة', table: 'shipments', filter: { status: 'in_transit' }, checkType: 'count_above', threshold: 0, boostAmount: 15 },
      ]},
      { widgetId: 'alerts', baseWeight: 70, liveBoostConditions: [
        { id: 'unread-alerts', labelAr: 'تنبيهات غير مقروءة', table: 'notifications', filter: { is_read: 'false' }, checkType: 'count_above', threshold: 5, boostAmount: 25 },
      ]},
      { widgetId: 'wallet_summary', baseWeight: 65 },
      { widgetId: 'daily_operations', baseWeight: 60 },
      { widgetId: 'weekly_chart', baseWeight: 50 },
      { widgetId: 'sustainability', baseWeight: 45 },
      { widgetId: 'partners_summary', baseWeight: 40 },
      { widgetId: 'daily_pulse', baseWeight: 35 },
    ],
    roleOverrides: {
      employee: [
        { widgetId: 'kpi_cards', baseWeight: 100 },
        { widgetId: 'pending_approvals', baseWeight: 95 },
        { widgetId: 'daily_operations', baseWeight: 90 },
        { widgetId: 'alerts', baseWeight: 85 },
        { widgetId: 'recent_shipments', baseWeight: 70 },
      ],
    },
  },

  // ─── الناقل (Transporter) ───
  transporter: {
    orgType: 'transporter',
    labelAr: 'الناقل',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'quick_actions', baseWeight: 95 },
      { widgetId: 'command_center', baseWeight: 92 },
      { widgetId: 'kpi_cards', baseWeight: 90 },
      { widgetId: 'driver_tracking', baseWeight: 88, liveBoostConditions: [
        { id: 'active-drivers', labelAr: 'سائقين في مهام', table: 'driver_locations', filter: {}, checkType: 'count_above', threshold: 0, boostAmount: 15 },
      ]},
      { widgetId: 'recent_shipments', baseWeight: 85, liveBoostConditions: [
        { id: 'overdue-shipments', labelAr: 'شحنات متأخرة', table: 'shipments', filter: { status: 'in_transit' }, checkType: 'overdue', boostAmount: 30 },
      ]},
      { widgetId: 'pending_approvals', baseWeight: 80, liveBoostConditions: [
        { id: 'pending-collections', labelAr: 'طلبات جمع معلقة', table: 'collection_requests', filter: { status: 'pending' }, checkType: 'count_above', threshold: 0, boostAmount: 20 },
      ]},
      { widgetId: 'alerts', baseWeight: 75, liveBoostConditions: [
        { id: 'urgent-alerts', labelAr: 'تنبيهات عاجلة', table: 'notifications', filter: { is_read: 'false' }, checkType: 'count_above', threshold: 3, boostAmount: 25 },
      ]},
      { widgetId: 'fleet_health', baseWeight: 70 },
      { widgetId: 'wallet_summary', baseWeight: 65 },
      { widgetId: 'daily_operations', baseWeight: 60 },
      { widgetId: 'daily_pulse', baseWeight: 55 },
      { widgetId: 'weekly_chart', baseWeight: 50 },
      { widgetId: 'sustainability', baseWeight: 45 },
      { widgetId: 'partners_summary', baseWeight: 40 },
    ],
    roleOverrides: {
      driver: [
        { widgetId: 'kpi_cards', baseWeight: 100 },
        { widgetId: 'recent_shipments', baseWeight: 95 },
        { widgetId: 'alerts', baseWeight: 90 },
        { widgetId: 'daily_operations', baseWeight: 80 },
      ],
      employee: [
        { widgetId: 'kpi_cards', baseWeight: 100 },
        { widgetId: 'pending_approvals', baseWeight: 95 },
        { widgetId: 'daily_operations', baseWeight: 90 },
        { widgetId: 'recent_shipments', baseWeight: 85 },
      ],
    },
  },

  // ─── المدوّر (Recycler) ───
  recycler: {
    orgType: 'recycler',
    labelAr: 'المدوّر',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'quick_actions', baseWeight: 95 },
      { widgetId: 'kpi_cards', baseWeight: 90 },
      { widgetId: 'recent_shipments', baseWeight: 88, liveBoostConditions: [
        { id: 'incoming-shipments', labelAr: 'شحنات واردة', table: 'shipments', filter: { status: 'in_transit' }, checkType: 'count_above', threshold: 0, boostAmount: 20 },
      ]},
      { widgetId: 'pending_approvals', baseWeight: 82 },
      { widgetId: 'daily_operations', baseWeight: 78 },
      { widgetId: 'alerts', baseWeight: 75 },
      { widgetId: 'wallet_summary', baseWeight: 70 },
      { widgetId: 'weekly_chart', baseWeight: 55 },
      { widgetId: 'sustainability', baseWeight: 50 },
      { widgetId: 'partners_summary', baseWeight: 45 },
    ],
    roleOverrides: {
      employee: [
        { widgetId: 'kpi_cards', baseWeight: 100 },
        { widgetId: 'recent_shipments', baseWeight: 95 },
        { widgetId: 'daily_operations', baseWeight: 90 },
      ],
    },
  },

  // ─── التخلص النهائي (Disposal) ───
  disposal: {
    orgType: 'disposal',
    labelAr: 'التخلص النهائي',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'quick_actions', baseWeight: 95 },
      { widgetId: 'kpi_cards', baseWeight: 90 },
      { widgetId: 'recent_shipments', baseWeight: 85, liveBoostConditions: [
        { id: 'incoming', labelAr: 'شحنات واردة', table: 'shipments', filter: { status: 'in_transit' }, checkType: 'count_above', threshold: 0, boostAmount: 20 },
      ]},
      { widgetId: 'alerts', baseWeight: 80 },
      { widgetId: 'pending_approvals', baseWeight: 75 },
      { widgetId: 'daily_operations', baseWeight: 70 },
      { widgetId: 'wallet_summary', baseWeight: 60 },
      { widgetId: 'weekly_chart', baseWeight: 50 },
      { widgetId: 'partners_summary', baseWeight: 40 },
    ],
  },

  // ─── المستشار (Consultant) ───
  consultant: {
    orgType: 'consultant',
    labelAr: 'المستشار',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'kpi_cards', baseWeight: 95 },
      { widgetId: 'pending_approvals', baseWeight: 90 },
      { widgetId: 'alerts', baseWeight: 85 },
      { widgetId: 'partners_summary', baseWeight: 80 },
      { widgetId: 'weekly_chart', baseWeight: 60 },
    ],
  },

  // ─── المكتب الاستشاري (Consulting Office) ───
  consulting_office: {
    orgType: 'consulting_office',
    labelAr: 'المكتب الاستشاري',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'kpi_cards', baseWeight: 95 },
      { widgetId: 'pending_approvals', baseWeight: 90 },
      { widgetId: 'alerts', baseWeight: 85 },
      { widgetId: 'partners_summary', baseWeight: 80 },
      { widgetId: 'weekly_chart', baseWeight: 65 },
      { widgetId: 'daily_operations', baseWeight: 55 },
    ],
  },

  // ─── السائق (Driver) ───
  driver: {
    orgType: 'driver',
    labelAr: 'السائق',
    priorities: [
      { widgetId: 'kpi_cards', baseWeight: 100 },
      { widgetId: 'recent_shipments', baseWeight: 95, liveBoostConditions: [
        { id: 'my-active', labelAr: 'مهامي النشطة', table: 'shipments', filter: { status: 'in_transit' }, checkType: 'count_above', threshold: 0, boostAmount: 10 },
      ]},
      { widgetId: 'alerts', baseWeight: 90, liveBoostConditions: [
        { id: 'driver-alerts', labelAr: 'تنبيهات السائق', table: 'notifications', filter: { is_read: 'false' }, checkType: 'count_above', threshold: 0, boostAmount: 20 },
      ]},
      { widgetId: 'daily_operations', baseWeight: 80 },
    ],
  },

  // ─── الموظف (Employee) ───
  employee: {
    orgType: 'employee',
    labelAr: 'الموظف',
    priorities: [
      { widgetId: 'kpi_cards', baseWeight: 100 },
      { widgetId: 'pending_approvals', baseWeight: 95 },
      { widgetId: 'alerts', baseWeight: 90 },
      { widgetId: 'daily_operations', baseWeight: 85 },
      { widgetId: 'recent_shipments', baseWeight: 70 },
    ],
  },

  // ─── الجهة الرقابية (Regulator) ───
  regulator: {
    orgType: 'regulator',
    labelAr: 'الجهة الرقابية',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'kpi_cards', baseWeight: 95 },
      { widgetId: 'pending_approvals', baseWeight: 92 },
      { widgetId: 'alerts', baseWeight: 88, liveBoostConditions: [
        { id: 'violations', labelAr: 'مخالفات جديدة', table: 'notifications', filter: { is_read: 'false' }, checkType: 'count_above', threshold: 0, boostAmount: 30 },
      ]},
      { widgetId: 'weekly_chart', baseWeight: 70 },
      { widgetId: 'sustainability', baseWeight: 65 },
    ],
  },

  // ─── جهة ISO (ISO Body) ───
  iso_body: {
    orgType: 'iso_body',
    labelAr: 'جهة ISO',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'kpi_cards', baseWeight: 95 },
      { widgetId: 'pending_approvals', baseWeight: 90 },
      { widgetId: 'alerts', baseWeight: 85 },
    ],
  },

  // ─── مدير النظام (Admin) ───
  admin: {
    orgType: 'admin',
    labelAr: 'مدير النظام',
    priorities: [
      { widgetId: 'digital_identity_card', baseWeight: 100 },
      { widgetId: 'kpi_cards', baseWeight: 95 },
      { widgetId: 'pending_approvals', baseWeight: 92, liveBoostConditions: [
        { id: 'admin-approvals', labelAr: 'طلبات منتظرة', table: 'approval_requests', filter: { status: 'pending' }, checkType: 'count_above', threshold: 0, boostAmount: 25 },
      ]},
      { widgetId: 'alerts', baseWeight: 88 },
      { widgetId: 'recent_shipments', baseWeight: 80 },
      { widgetId: 'daily_operations', baseWeight: 75 },
      { widgetId: 'weekly_chart', baseWeight: 60 },
      { widgetId: 'sustainability', baseWeight: 50 },
    ],
  },
};

/** الحصول على ملف الأولويات لجهة معينة */
export const getPriorityProfile = (orgType: string): OrgPriorityProfile | undefined => {
  return PRIORITY_PROFILES[orgType];
};

/** الحصول على أولويات مخصصة حسب الدور داخل الجهة */
export const getRolePriorities = (orgType: string, role: string): PriorityWeight[] | undefined => {
  return PRIORITY_PROFILES[orgType]?.roleOverrides?.[role];
};
