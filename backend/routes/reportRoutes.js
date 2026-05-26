const express      = require('express');
const router       = express.Router();
const Customer     = require('../models/Customer');
const ServiceVisit = require('../models/ServiceVisit');
const Payment      = require('../models/Payment');
const protect      = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {

    // 1. Customer stats
    const customers    = await Customer.find();
    const totalCustomers = customers.length;
    const activeAMC    = customers.filter(c => c.amc?.status === 'active').length;
    const expiringAMC  = customers.filter(c => c.amc?.status === 'expiring').length;
    const expiredAMC   = customers.filter(c => c.amc?.status === 'expired').length;

    // 2. Product type breakdown
    const productBreakdown = customers.reduce((acc, c) => {
      const type = c.productType || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const productData = Object.entries(productBreakdown).map(([name, value]) => ({ name, value }));

    // 3. AMC status breakdown
    const amcStatusData = [
      { name: 'Active',   value: activeAMC,   color: '#22c55e' },
      { name: 'Expiring', value: expiringAMC, color: '#eab308' },
      { name: 'Expired',  value: expiredAMC,  color: '#ef4444' },
    ];

    // 4. Monthly revenue from payments (last 6 months)
    const payments = await Payment.find({ type: 'customer_payment', status: 'Paid' });
    const monthlyRevenue = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[key] = 0;
    }

    payments.forEach(p => {
      const d   = new Date(p.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyRevenue.hasOwnProperty(key)) {
        monthlyRevenue[key] += p.amount;
      }
    });

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

    // 5. Payment mode breakdown
    const allPayments = await Payment.find({ type: 'customer_payment', status: 'Paid' });
    const modeBreakdown = { Cash: 0, UPI: 0, 'Bank Transfer': 0, Cheque: 0 };
    allPayments.forEach(p => {
      if (modeBreakdown.hasOwnProperty(p.paymentMode)) {
        modeBreakdown[p.paymentMode] += p.amount;
      }
    });
    const modeData = Object.entries(modeBreakdown).map(([name, value]) => ({ name, value }));

    // 6. Service visit stats
    const visits        = await ServiceVisit.find();
    const totalVisits   = visits.length;
    const pendingVisits = visits.filter(v => v.status === 'Pending').length;
    const resolvedVisits = visits.filter(v => v.status === 'Resolved').length;

    // 7. Monthly service visits (last 6 months)
    const monthlyVisits = {};
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyVisits[key] = 0;
    }
    visits.forEach(v => {
      const d   = new Date(v.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyVisits.hasOwnProperty(key)) {
        monthlyVisits[key] += 1;
      }
    });
    const visitsData = Object.entries(monthlyVisits).map(([month, count]) => ({ month, count }));

    // 8. Total financials
    const allPaymentsAll  = await Payment.find();
    const totalCollected  = allPaymentsAll.filter(p => p.type === 'customer_payment' && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
    const totalDue        = allPaymentsAll.filter(p => p.type === 'customer_payment' && p.status === 'Due').reduce((s, p) => s + p.amount, 0);
    const totalSpent      = allPaymentsAll.filter(p => p.type === 'raw_material').reduce((s, p) => s + p.amount, 0);
    const totalOwed       = allPaymentsAll.filter(p => p.type === 'supplier_due' && p.status === 'Due').reduce((s, p) => s + p.amount, 0);
    const netProfit       = totalCollected - totalSpent;

    res.json({
      customers: { totalCustomers, activeAMC, expiringAMC, expiredAMC },
      visits:    { totalVisits, pendingVisits, resolvedVisits },
      financials: { totalCollected, totalDue, totalSpent, totalOwed, netProfit },
      charts: { revenueData, amcStatusData, productData, modeData, visitsData },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;