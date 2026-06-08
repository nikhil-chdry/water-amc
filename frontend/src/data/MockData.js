export const customers = [
  {
    _id: '1',
    name: 'Ramesh Sharma',
    phone: '9876543210',
    address: 'Vaishali Nagar, Jaipur',
    productType: 'RO Filter',
    installDate: '2023-06-15',
    amc: { startDate: '2024-06-15', endDate: '2025-06-15', amount: 2500, status: 'active' },
  },
  {
    _id: '2',
    name: 'Sunita Devi',
    phone: '9812345678',
    address: 'Mansarovar, Jaipur',
    productType: 'Water Cooler',
    installDate: '2023-01-10',
    amc: { startDate: '2024-11-20', endDate: '2025-02-20', amount: 12000, status: 'expiring' },
  },
  {
    _id: '4',
    name: 'Priya Joshi',
    phone: '9988776655',
    address: 'Tonk Road, Jaipur',
    productType: 'RO Filter',
    installDate: '2024-03-05',
    amc: { startDate: '2024-03-05', endDate: '2025-03-05', amount: 2500, status: 'active' },
  },
  {
    _id: '5',
    name: 'Mohan Lal',
    phone: '9123456780',
    address: 'Sanganer, Jaipur',
    productType: 'Water Cooler',
    installDate: '2023-08-12',
    amc: { startDate: '2024-08-12', endDate: '2025-08-12', amount: 3500, status: 'active' },
  },
];

export const stats = {
  totalCustomers: 5,
  activeAMC: 3,
  expiringAMC: 1,
  expiredAMC: 1,
  revenueThisMonth: 18000,
};
