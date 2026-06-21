const User = require('../../../models/User');
const Medication = require('../../../models/Medication');
const HealthRecord = require('../../../models/HealthRecord');
const mongoose = require('mongoose');

class UserContextService {
  /**
   * Fetches deterministic structured context for a given user.
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<Object>} The assembled user state object
   */
  static async getContext(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }

    try {
      const [user, medications, healthRecords] = await Promise.all([
        User.findById(userId).select('name age gender allergies emergencyContacts').lean(),
        Medication.find({ userId, isActive: true }).select('name dosage frequency scheduleTimes').lean(),
        HealthRecord.find({ userId }).sort({ recordDate: -1 }).limit(1).select('vitals symptoms').lean()
      ]);

      if (!user) return null;

      const latestHealth = healthRecords.length > 0 ? healthRecords[0] : null;

      return {
        profile: {
          name: user.name || 'User',
          age: user.age || 'Unknown',
          gender: user.gender || 'Unknown',
          allergies: user.allergies || []
        },
        emergencyContacts: user.emergencyContacts || [],
        medications: medications || [],
        latestHealth: latestHealth ? {
          vitals: latestHealth.vitals,
          symptoms: latestHealth.symptoms
        } : null
      };
    } catch (error) {
      console.error('[UserContextService] Failed to fetch user context:', error.message);
      return null;
    }
  }
}

module.exports = UserContextService;
