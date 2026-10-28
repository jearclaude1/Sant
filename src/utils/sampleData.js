// Sample initial transaction records for Santa Columbus Apartments MIS
export const sampleTransactions = [
  {
    id: 'tx-sca-001',
    receiptNo: 'SCA-2026-1042',
    date: '2026-10-15',
    userName: 'Sarah Jenkins',
    recordedBy: 'Sarah Jenkins',
    notes: 'Apt 302 & 305 plumbing fixture replacements',
    items: [
      { id: 'item-1', name: 'Bathroom Ceramic Mixer Taps', quantity: 4, price: 45.00, subtotal: 180.00 },
      { id: 'item-2', name: 'Heavy Duty PVC Pipe Connectors (Set of 10)', quantity: 2, price: 25.00, subtotal: 50.00 },
      { id: 'item-3', name: 'High-Pressure Water Pump Pressure Gauge', quantity: 1, price: 65.00, subtotal: 65.00 }
    ],
    itemsTotal: 295.00,
    fees: 10.00,
    feesNote: 'Hardware delivery fee',
    totalAmount: 305.00,
    createdAt: new Date('2026-10-15T09:30:00').toISOString(),
  },
  {
    id: 'tx-sca-002',
    receiptNo: 'SCA-2026-1043',
    date: '2026-10-15',
    userName: 'David Miller',
    recordedBy: 'David Miller',
    notes: 'Common corridors & apartment block lighting restock',
    items: [
      { id: 'item-1', name: 'Philips Warm White LED Bulbs 12W (Pack of 10)', quantity: 6, price: 28.00, subtotal: 168.00 },
      { id: 'item-2', name: 'Motion Sensor Outdoor Security Floodlights', quantity: 2, price: 55.00, subtotal: 110.00 }
    ],
    itemsTotal: 278.00,
    fees: 5.00,
    feesNote: 'Bank processing fee',
    totalAmount: 283.00,
    createdAt: new Date('2026-10-15T11:15:00').toISOString(),
  },
  {
    id: 'tx-sca-003',
    receiptNo: 'SCA-2026-1044',
    date: '2026-10-14',
    userName: 'Sarah Jenkins',
    recordedBy: 'Sarah Jenkins',
    notes: 'Apartment complex backup generator diesel refueling',
    items: [
      { id: 'item-1', name: 'Diesel Generator Fuel (Liters)', quantity: 250, price: 1.50, subtotal: 375.00 },
      { id: 'item-2', name: 'Heavy Duty Generator Oil Filter', quantity: 2, price: 35.00, subtotal: 70.00 }
    ],
    itemsTotal: 445.00,
    fees: 12.00,
    feesNote: 'Fuel tanker delivery charge',
    totalAmount: 457.00,
    createdAt: new Date('2026-10-14T14:20:00').toISOString(),
  },
  {
    id: 'tx-sca-004',
    receiptNo: 'SCA-2026-1045',
    date: '2026-10-12',
    userName: 'David Miller',
    recordedBy: 'David Miller',
    notes: 'Apartment housekeeping & pool maintenance chemicals',
    items: [
      { id: 'item-1', name: 'Swimming Pool Chlorine Granules (25kg Drum)', quantity: 2, price: 85.00, subtotal: 170.00 },
      { id: 'item-2', name: 'Industrial Floor Cleaning Detergent (20L)', quantity: 3, price: 42.00, subtotal: 126.00 },
      { id: 'item-3', name: 'Heavy Duty Mop Heads & Buckets', quantity: 4, price: 18.00, subtotal: 72.00 }
    ],
    itemsTotal: 368.00,
    fees: 0.00,
    feesNote: 'No fee',
    totalAmount: 368.00,
    createdAt: new Date('2026-10-12T10:00:00').toISOString(),
  },
  {
    id: 'tx-sca-005',
    receiptNo: 'SCA-2026-1046',
    date: '2026-10-08',
    userName: 'Sarah Jenkins',
    recordedBy: 'Sarah Jenkins',
    notes: 'Apartment security gate repairs and access cards',
    items: [
      { id: 'item-1', name: 'RFID Tenant Access Keycards (Pack of 100)', quantity: 2, price: 65.00, subtotal: 130.00 },
      { id: 'item-2', name: 'Automated Sliding Gate Motor Belt & Sensor', quantity: 1, price: 210.00, subtotal: 210.00 }
    ],
    itemsTotal: 340.00,
    fees: 15.00,
    feesNote: 'Courier service fee',
    totalAmount: 355.00,
    createdAt: new Date('2026-10-08T16:45:00').toISOString(),
  },
  {
    id: 'tx-sca-006',
    receiptNo: 'SCA-2026-1047',
    date: '2026-09-28',
    userName: 'David Miller',
    recordedBy: 'David Miller',
    notes: 'Elevator quarterly maintenance service inspection parts',
    items: [
      { id: 'item-1', name: 'Elevator Door Guide Shoes & Rollers', quantity: 4, price: 58.00, subtotal: 232.00 },
      { id: 'item-2', name: 'High-Vis Emergency Stop Warning Signage', quantity: 5, price: 12.00, subtotal: 60.00 }
    ],
    itemsTotal: 292.00,
    fees: 8.00,
    feesNote: 'Transaction wire charge',
    totalAmount: 300.00,
    createdAt: new Date('2026-09-28T13:10:00').toISOString(),
  }
];

export const CATEGORIES = [
  'Plumbing & Water Systems',
  'Electrical & Lighting',
  'Security & Access Control',
  'Cleaning & Housekeeping',
  'Elevator & Mechanical',
  'Generator & Fuel',
  'Gardening & Landscaping',
  'General Maintenance & Repairs',
  'Other Expenses'
];

