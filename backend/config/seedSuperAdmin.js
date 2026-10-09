import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const seedSuperAdmin = async () => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const adminName = process.env.SUPER_ADMIN_NAME || 'Platform Super Admin';

    if (!adminEmail || !adminPassword) {
      console.log('[SEED] Super Admin credentials not found in .env. Skipping bootstrap.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      const created = await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'superadmin',
      });
      console.log(`[SEED] Super Admin provisioned in database: ${adminEmail} (ID: ${created._id})`);
    } else {
      if (existingAdmin.role !== 'superadmin') {
        existingAdmin.role = 'superadmin';
        await existingAdmin.save();
        console.log(`[SEED] Super Admin role confirmed for: ${adminEmail}`);
      } else {
        console.log(`[SEED] Super Admin verified in database: ${adminEmail}`);
      }
    }
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed super admin:', error.message);
  }
};