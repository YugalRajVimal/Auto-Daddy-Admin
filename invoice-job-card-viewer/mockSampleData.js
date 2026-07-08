/**
 * Sample job card payload — use with <InvoiceJobCardViewer job={SAMPLE_JOB} /> for offline preview.
 * Shape matches the Auto-Daddy API job card document.
 */
export const SAMPLE_BUSINESS = {
  businessName: "Maple Auto Care",
  businessCategory: "Auto Service",
  businessAddress: "123 Main Street",
  cityName: "Toronto",
  pincode: "M5V 2T6",
  businessHSTNumber: "123456789RT0001",
  businessLogo: "https://placehold.co/120x52/42a5f5/ffffff?text=LOGO",
  accountName: "Maple Auto Care Inc.",
  interacEmail: "payments@mapleautocare.example",
  termsAndConditions:
    "Payment is due within 14 days. All work is guaranteed for 90 days or 5,000 km, whichever comes first.",
  gst: 13,
};

export const SAMPLE_JOB = {
  _id: "demo-job-card-001",
  jobNo: "10428",
  invoiceNumber: "INV-10428",
  createdAt: "2026-06-20T14:30:00.000Z",
  paymentStatus: "Unpaid",
  paymentMethod: "Online",
  odometerReading: 45230,
  dueOdometerReading: 45730,
  labourCharge: 85,
  labourDuration: 1.5,
  technicalRemarks: "Labour: 1.5 hr, $85.00",
  additionalNotes: "Customer requested synthetic oil. Checked brake pads — OK.",
  totalPayableAmount: 312.45,
  payableAmounts: {
    invoiceTotal: 276.5,
    cash: 276.5,
    online: 312.45,
    gstRate: 13,
    gstAmount: 35.95,
    roundOff: 0,
  },
  business: SAMPLE_BUSINESS,
  customerId: {
    name: "Alex Johnson",
    phone: "+1 416-555-0198",
    email: "alex.johnson@example.com",
    address: "88 Oak Avenue",
    city: "Toronto",
    pincode: "M4B 1B3",
  },
  vehicleId: {
    licensePlateNo: "ONAB 1234",
    vin: "1HGCM82633A123456",
    cin: "CHS998877",
    make: { name: "Honda", model: "Civic" },
  },
  services: [
    {
      service: { name: "Maintenance" },
      subServices: [
        {
          name: "Synthetic Oil Change",
          desc: "5W-30 full synthetic + filter",
          unitPrice: 49.99,
          qty: 1,
          labourCost: 25,
          price: 74.99,
        },
        {
          name: "Tire Rotation",
          desc: "All four wheels",
          unitPrice: 29.99,
          qty: 1,
          labourCost: 15,
          price: 44.99,
        },
      ],
    },
    {
      service: { name: "Inspection" },
      subServices: [
        {
          name: "Multi-Point Inspection",
          desc: "Brakes, fluids, belts",
          unitPrice: 0,
          qty: 1,
          labourCost: 0,
          price: 0,
        },
      ],
    },
  ],
  vehiclePhotos: [
    "https://placehold.co/200x200/e3f2fd/42a5f5?text=Front",
    "https://placehold.co/200x200/e8f5e9/2e7d32?text=Side",
  ],
};

/** Same job with Cash payment (no HST on printable invoice). */
export const SAMPLE_JOB_CASH = {
  ...SAMPLE_JOB,
  paymentMethod: "Cash",
  paymentStatus: "Paid",
  totalPayableAmount: 276.5,
  payableAmounts: {
    invoiceTotal: 276.5,
    cash: 276.5,
    online: 312.45,
    gstRate: 13,
    gstAmount: 0,
    roundOff: 0,
  },
};
