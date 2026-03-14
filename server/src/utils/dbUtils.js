import mongoose from 'mongoose';

/**
 * Checks if the current MongoDB connection supports transactions.
 * Transactions are only supported on Replica Sets or Sharded Clusters.
 */
export const areTransactionsSupported = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const result = await admin.command({ isMaster: 1 });
    // If setName is present, it's a replica set
    return !!(result.setName || result.isreplicaset);
  } catch (error) {
    console.error('Error checking transaction support:', error);
    return false;
  }
};
