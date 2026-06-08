const express      = require('express');
const router       = express.Router();
const Customer     = require('../models/Customer');
const ServiceVisit = require('../models/Servicevisit');
const Payment      = require('../models/Payment');
const protect      = require('../middleware/Auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();

    // 1. Customer stats
    const customers      = await Customer.find({ createdBy: userId });
    const totalCustomers = customers.length;
    const activeAMC      = customers.filter(c => c.amc?.status === 'active').length;
    const expiringAMC    = customers.filter(c => c.amc?.status === 'expiring').length;
    const expiredAMC     = customers.filter(c => c.amc?.status === 'expired').length;

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

    // 4. Monthly revenue (last 6 months) — include partial paid amounts
    const monthlyRevenue = {};
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[key] = 0;
    }

    const paidPayments = await Payment.find({
      createdBy: userId,
      type:      'customer_payment',
      status:    { $in: ['Paid', 'Partial'] }, // include both
    });

    paidPayments.forEach(p => {
      const d   = new Date(p.date);
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyRevenue.hasOwnProperty(key)) {
        // Use paidAmount for partial, full amount for paid
        const amt = p.status === 'Partial' ? (p.paidAmount || 0) : p.amount;
        monthlyRevenue[key] += amt;
      }
    });

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

    // 5. Payment mode breakdown — include partial
    const modeBreakdown = { Cash: 0, UPI: 0, 'Bank Transfer': 0, Cheque: 0 };
    paidPayments.forEach(p => {
      if (p.status === 'Due') return;
      const paidAmt = p.status === 'Partial' ? (p.paidAmount || 0) : p.amount;
      if (p.isSplit && p.splitPayments?.length > 0) {
        const splitSum = p.splitPayments.reduce((s, sp) => s + sp.amount, 0);
        p.splitPayments.forEach(s => {
          if (modeBreakdown.hasOwnProperty(s.paymentMode)) {
            const proportion = splitSum > 0 ? (s.amount / splitSum) : 0;
            modeBreakdown[s.paymentMode] += Math.round(paidAmt * proportion);
          }
        });
      } else {
        if (modeBreakdown.hasOwnProperty(p.paymentMode)) {
          modeBreakdown[p.paymentMode] += paidAmt;
        }
      }
    });

    const modeData = Object.entries(modeBreakdown).map(([name, value]) => ({ name, value }));

    // 6. Service visit stats
    const visits         = await ServiceVisit.find({ createdBy: userId });
    const totalVisits    = visits.length;
    const pendingVisits  = visits.filter(v => v.status === 'Pending').length;
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

    // 8. Total financials — include partial paid amounts
    // 8. Total financials
const allPayments = await Payment.find({ createdBy: userId });
const allVisits   = await ServiceVisit.find({ createdBy: userId });

const totalCollected = allPayments
  .filter(p => p.type === 'customer_payment')
  .reduce((sum, p) => {
    if (p.status === 'Paid')    return sum + p.amount;
    if (p.status === 'Partial') return sum + (p.paidAmount || 0);
    return sum;
  }, 0);

const totalDue = allPayments
  .filter(p => p.type === 'customer_payment')
  .reduce((sum, p) => {
    if (p.status === 'Due')     return sum + p.amount;
    if (p.status === 'Partial') return sum + (p.amount - (p.paidAmount || 0));
    return sum;
  }, 0);

const totalSpent = allPayments
  .filter(p => p.type === 'raw_material')
  .reduce((s, p) => s + p.amount, 0);

const totalOwed = allPayments
  .filter(p => p.type === 'supplier_due' && p.status === 'Due')
  .reduce((s, p) => s + p.amount, 0);

// Service visit revenue
const serviceRevenue = allVisits
  .filter(v => v.cost > 0)
  .reduce((s, v) => s + v.cost, 0);

const netProfit = totalCollected + serviceRevenue - totalSpent;

    res.json({
      customers:  { totalCustomers, activeAMC, expiringAMC, expiredAMC },
      visits:     { totalVisits, pendingVisits, resolvedVisits },
      financials: { totalCollected, totalDue, totalSpent, totalOwed, netProfit, serviceRevenue },
      charts:     { revenueData, amcStatusData, productData, modeData, visitsData },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;