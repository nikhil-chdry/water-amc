const cron     = require('node-cron');
const Customer = require('../models/customer');
const sendEmail = require('./sendEmail');

function startReminderJob() {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log(' Running daily AMC reminder check...');

    try {
      const customers = await Customer.find();
      const today     = new Date();

      for (const customer of customers) {
        if (!customer.amc?.endDate || !customer.amc?.email) continue;

        const end      = new Date(customer.amc.endDate);
        const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

        // Send reminder at 30, 15, and 7 days before expiry
        if ([30, 15, 7].includes(daysLeft)) {
          await sendEmail({
            to:      customer.amc.email,
            subject: `⚠️ AMC Expiring in ${daysLeft} Days — ${customer.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                <h2 style="color: #1d4ed8;">💧 Water AMC Reminder</h2>
                <p>Dear <strong>${customer.name}</strong>,</p>
                <p>Your AMC for <strong>${customer.productType}</strong> is expiring in <strong style="color: #ef4444;">${daysLeft} days</strong>.</p>
                <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
                  <tr style="background:#e0e7ff;">
                    <td style="padding: 8px 12px; font-weight: bold;">AMC End Date</td>
                    <td style="padding: 8px 12px;">${customer.amc.endDate.toISOString().split('T')[0]}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 12px; font-weight: bold;">Amount</td>
                    <td style="padding: 8px 12px;">₹${customer.amc.amount?.toLocaleString()}</td>
                  </tr>
                  <tr style="background:#e0e7ff;">
                    <td style="padding: 8px 12px; font-weight: bold;">Product</td>
                    <td style="padding: 8px 12px;">${customer.productType}</td>
                  </tr>
                </table>
                <p>Please contact us to renew your AMC and avoid any service interruptions.</p>
                <p style="color: #6b7280; font-size: 13px;">— Water AMC Management System, Jaipur</p>
              </div>
            `,
          });
          console.log(` Reminder sent to ${customer.name} (${daysLeft} days left)`);
        }
      }
    } catch (err) {
      console.error(' Reminder job error:', err.message);
    }
  });

  // console.log('✅ Daily reminder job scheduled at 9:00 AM');
}

module.exports = startReminderJob;