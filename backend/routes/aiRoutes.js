const express      = require('express');
const router       = express.Router();
const Customer     = require('../models/Customer');
const Payment      = require('../models/Payment');
const ServiceVisit = require('../models/ServiceVisit');
const protect      = require('../middleware/auth');


router.use(protect);

// Calculate churn risk score for all customers
router.get('/churn', async (req, res) => {
  try {
    const userId    = req.user._id;
    const customers = await Customer.find({ createdBy: userId });
    const payments  = await Payment.find({ createdBy: userId });
    const visits    = await ServiceVisit.find({ createdBy: userId });

    const today     = new Date();
    const sixMonths = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());

    const scored = customers.map(c => {
      let score  = 0;
      const reasons = [];

      // 1. AMC Status
      const amcStatus = c.amc?.status;
      if (amcStatus === 'expired') {
        score += 40;
        reasons.push('AMC has expired');
      } else if (amcStatus === 'expiring') {
        score += 20;
        reasons.push('AMC expiring soon');
      } else if (amcStatus === 'no_amc') {
        score += 10;
        reasons.push('No AMC contract');
      }

      // 2. Due payments
      const customerPayments = payments.filter(
        p => p.customer?.toString() === c._id.toString()
      );
      const hasDue = customerPayments.some(
        p => p.status === 'Due' || p.status === 'Partial'
      );
      if (hasDue) {
        score += 20;
        reasons.push('Has pending payments');
      }

      // 3. No service visit in last 6 months
      const customerVisits = visits.filter(
        v => v.customer?.toString() === c._id.toString()
      );
      const recentVisit = customerVisits.find(
        v => new Date(v.date) >= sixMonths
      );
      if (!recentVisit && customerVisits.length > 0) {
        score += 10;
        reasons.push('No service in 6 months');
      }

      // 4. Multiple unresolved complaints
      const pendingVisits = customerVisits.filter(
        v => v.status === 'Pending' || v.status === 'In Progress'
      );
      if (pendingVisits.length >= 2) {
        score += 10;
        reasons.push(`${pendingVisits.length} unresolved complaints`);
      }

      // 5. Days since AMC expired (extra penalty)
      if (c.amc?.endDate && amcStatus === 'expired') {
        const end      = new Date(c.amc.endDate);
        const daysOver = Math.ceil((today - end) / (1000 * 60 * 60 * 24));
        if (daysOver > 90) {
          score += 15;
          reasons.push(`AMC expired ${daysOver} days ago`);
        }
      }

      // Cap at 100
      score = Math.min(score, 100);

      // Risk level
      let risk  = 'Low';
      let color = 'green';
      if (score >= 61) { risk = 'High';   color = 'red';    }
      else if (score >= 31) { risk = 'Medium'; color = 'yellow'; }

      return {
        _id:         c._id,
        name:        c.name,
        phone:       c.phone,
        productType: c.productType,
        address:     c.address,
        amcStatus:   c.amc?.status,
        amcEndDate:  c.amc?.endDate,
        score,
        risk,
        color,
        reasons,
      };
    });

    // Sort by score descending (highest risk first)
    scored.sort((a, b) => b.score - a.score);

    // Summary stats
    const summary = {
      high:   scored.filter(c => c.risk === 'High').length,
      medium: scored.filter(c => c.risk === 'Medium').length,
      low:    scored.filter(c => c.risk === 'Low').length,
      avgScore: Math.round(scored.reduce((s, c) => s + c.score, 0) / (scored.length || 1)),
    };

    res.json({ customers: scored, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Revenue forecast — next 3 months based on upcoming AMC renewals
router.get('/forecast', async (req, res) => {
  try {
    const userId    = req.user._id;
    const customers = await Customer.find({ createdBy: userId });
    const today     = new Date();

    const forecast = [];

    for (let i = 1; i <= 3; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd   = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
      const monthName  = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Customers whose AMC expires this month (likely to renew)
      const renewals = customers.filter(c => {
        if (!c.amc?.endDate || !c.hasAMC) return false;
        const end = new Date(c.amc.endDate);
        return end >= monthStart && end <= monthEnd;
      });

      const expectedRevenue = renewals.reduce((sum, c) => sum + (c.amc?.amount || 0), 0);
      const renewalCount    = renewals.length;

      forecast.push({
        month:           monthName,
        expectedRevenue,
        renewalCount,
        customers:       renewals.map(c => ({ name: c.name, amount: c.amc?.amount })),
      });
    }

    res.json({ forecast });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const { analyzeComplaint } = require('../utils/complaintAnalyzer');
router.post('/analyze-complaint', async (req, res) => {
  try {
    const { complaint } = req.body;
    if (!complaint) return res.status(400).json({ message: 'Complaint text required' });

    const result = analyzeComplaint(complaint);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;