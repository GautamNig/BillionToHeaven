// src/lib/donationsService.js
import { supabase } from './supabase';
import { MessageBottleService } from './messageBottleService';

export class DonationsService {
  
  // Add a new donation
  static async addDonation(amount, userId = null, userEmail = null) {
    try {
        console.log(`💰 Adding donation: $${amount} from user: ${userId}`);
        
        const donationData = {
            amount: parseFloat(amount),
            user_id: userId,
            user_email: userEmail,
            created_at: new Date().toISOString()
        };

        const { data: donation, error } = await supabase
            .from('donations')
            .insert([donationData])
            .select()
            .single();

        if (error) throw error;

        console.log(`✅ Donation created: ${donation.id}`);
        
        // STEP 1: Add empty bottle to user's inventory
        if (userId) {
            console.log(`🏺 Adding bottle to inventory for donation ${donation.id}`);
            await this.addBottleToInventory(userId, donation.id);
            
            // STEP 2: Add user to queue (MINIMAL - just add them)
            await this.addUserToQueue(userId, donation.id);
        }

        // STEP 3: Try to serve any floating bottles to this user first
        if (userId) {
            const servedBottle = await this.tryServeFloatingBottleToUser(donation.id, userId);
            if (servedBottle) {
                console.log(`🎉 User ${userId} received floating bottle immediately`);
                return { 
                    donation, 
                    immediateBottle: servedBottle,
                    queueStatus: 'served_immediately' 
                };
            }
        }

        // STEP 4: Legacy - Try to find random bottle (keep for compatibility)
        try {
            const foundBottle = await MessageBottleService.findRandomBottle(donation.id, userId);
            if (foundBottle) {
                console.log('🔍 Found random bottle (legacy):', foundBottle.id);
                return { 
                    donation, 
                    bottle: foundBottle,
                    queueStatus: 'found_random' 
                };
            }
        } catch (bottleError) {
            console.warn('⚠️ Could not find bottle (legacy):', bottleError);
        }

        // User is in queue waiting for a bottle
        return { 
            donation, 
            queueStatus: 'waiting_in_queue' 
        };

    } catch (error) {
        console.error('❌ Error adding donation:', error);
        throw error;
    }
  }

  // New method to add user to queue (MINIMAL - STEP 1)
  static async addUserToQueue(userId, donationId) {
    try {
        console.log(`⏳ Adding user ${userId} to queue for donation ${donationId}`);
        
        // First check if user is already in queue
        const { data: existingEntry, error: checkError } = await supabase
            .from('bottle_queue_entries')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'waiting')
            .maybeSingle();
        
        if (checkError) {
            console.error('❌ Error checking existing queue entry:', checkError);
            // Continue anyway - queue position will auto-increment
        }
        
        if (existingEntry) {
            console.log(`ℹ️ User ${userId} already in queue, skipping`);
            return existingEntry;
        }
        
        // Add to queue (queue_position will auto-increment via trigger)
        const { data: queueEntry, error } = await supabase
            .from('bottle_queue_entries')
            .insert([{
                user_id: userId,
                donation_id: donationId,
                status: 'waiting'
                // queue_position will be auto-set by trigger
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error adding to queue:', error);
            // Don't throw - queue is optional for now
            return null;
        }
        
        console.log(`✅ User added to queue at position ${queueEntry.queue_position}`);
        return queueEntry;
        
    } catch (error) {
        console.error('❌ Error in addUserToQueue:', error);
        // Don't throw - queue is optional
        return null;
    }
  }

  // Try to serve floating bottle to newly donated user
  static async tryServeFloatingBottleToUser(donationId, userId) {
    try {
        console.log(`🔍 Checking for floating bottles for user ${userId}`);
        
        // Find oldest floating bottle NOT from this user
        const { data: bottles, error } = await supabase
            .from('message_bottles')
            .select('*')
            .eq('status', 'floating')
            .order('created_at', { ascending: true })
            .limit(1);
        
        if (error) {
            console.error('❌ Error finding floating bottles:', error);
            return null;
        }
        
        if (!bottles || bottles.length === 0) {
            console.log('ℹ️ No floating bottles available');
            return null;
        }
        
        const bottle = bottles[0];
        
        // Check if bottle is from this user (shouldn't get own bottle)
        const { data: bottleDonation } = await supabase
            .from('donations')
            .select('user_id')
            .eq('id', bottle.sender_donation_id)
            .single();
        
        if (bottleDonation && bottleDonation.user_id === userId) {
            console.log('⚠️ Bottle is from same user, skipping');
            return null;
        }
        
        console.log(`✅ Found floating bottle: ${bottle.id}`);
        
        // Serve bottle to user
        const { error: updateError } = await supabase
            .from('message_bottles')
            .update({
                status: 'found',
                finder_donation_id: donationId,
                found_at: new Date().toISOString()
            })
            .eq('id', bottle.id);
        
        if (updateError) throw updateError;
        
        // ✅ FIX: Update user's queue entry to "served"
        const { error: queueError } = await supabase
            .from('bottle_queue_entries')
            .update({
                status: 'served',
                served_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('status', 'waiting');
        
        if (queueError) {
            console.warn('⚠️ Could not update queue entry:', queueError);
        } else {
            console.log(`✅ Updated queue entry for user ${userId} to "served"`);
        }
        
        return bottle;
        
    } catch (error) {
        console.error('❌ Error serving floating bottle:', error);
        return null;
    }
}
  // Get user's queue status (MINIMAL - for future use)
  static async getUserQueueStatus(userId) {
    try {
         const { data: queueEntry, error } = await supabase
            .from('bottle_queue_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'waiting')  // Only check "waiting" entries!
            .maybeSingle();
        
        if (error) {
            console.error('❌ Error getting queue status:', error);
            return { inQueue: false };
        }
        
        if (!queueEntry) {
            return { inQueue: false };
        }
        
        // Count how many are ahead in queue
        const { count, error: countError } = await supabase
            .from('bottle_queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting')
            .lt('queue_position', queueEntry.queue_position);
        
        if (countError) {
            console.warn('⚠️ Error counting queue positions:', countError);
        }
        
        const position = (count || 0) + 1;
        
        return {
            inQueue: true,
            queuePosition: position,
            queueEntryId: queueEntry.id
        };
        
    } catch (error) {
        console.error('❌ Error in getUserQueueStatus:', error);
        return { inQueue: false };
    }
  }

  // New method to add bottle to inventory
  static async addBottleToInventory(userId, donationId) {
    const { data, error } = await supabase
        .from('bottle_inventory')
        .insert([{
            user_id: userId,
            donation_id: donationId,
            status: 'empty'
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
  }

  // Add a new function for bottle creation
  static async addDonationWithBottle(amount, userId, userEmail, bottleMessage, bottleOptions = {}) {
    try {
        // First, create the donation
        const donation = await this.addDonation(amount, userId, userEmail);
        
        // Then create a bottle if message is provided
        if (bottleMessage && bottleMessage.trim()) {
            try {
                const bottle = await MessageBottleService.createBottle(
                    donation.id, 
                    {
                        message: bottleMessage,
                        isAnonymous: bottleOptions.isAnonymous !== false,
                        showDonationAmount: bottleOptions.showDonationAmount || false,
                        allowReply: bottleOptions.allowReply !== false
                    }
                );
                return { donation, bottle };
            } catch (bottleError) {
                // Return donation even if bottle creation fails
                console.warn('Bottle creation failed:', bottleError);
                return { donation };
            }
        }
        
        return { donation };
    } catch (error) {
        console.error('Error adding donation with bottle:', error);
        throw error;
    }
  }

  // Get total amount collected
  static async getTotalAmount() {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('amount');

      if (error) throw error;

      const total = data.reduce((sum, donation) => sum + parseFloat(donation.amount), 0);
      return total;
    } catch (error) {
      console.error('Error getting total amount:', error);
      return 0;
    }
  }

  // Get current goal
  static async getCurrentGoal() {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('goal_name', 'default')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting goal:', error);
      // Return default goal if none exists
      return {
        goal_name: 'default',
        target_amount: 1000000000.00
      };
    }
  }

  // Update goal
  static async updateGoal(targetAmount) {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update({ 
          target_amount: targetAmount,
          updated_at: new Date().toISOString()
        })
        .eq('goal_name', 'default')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  // Get recent donations (last 10)
  static async getRecentDonations(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent donations:', error);
      return [];
    }
  }

  // Get all donations (for admin purposes)
  static async getAllDonations() {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all donations:', error);
      return [];
    }
  }

  // Get queue statistics (MINIMAL - for monitoring)
  static async getQueueStats() {
    try {
        // Count waiting users
        const { count: waitingCount, error: countError } = await supabase
            .from('bottle_queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'waiting');
        
        if (countError) {
            console.error('❌ Error counting queue:', countError);
            return { waitingCount: 0 };
        }
        
        return {
            waitingCount: waitingCount || 0,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Error getting queue stats:', error);
        return { waitingCount: 0 };
    }
  }

  // Subscribe to real-time donations updates
  static subscribeToDonations(callback) {
    return supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }

  // Subscribe to goals updates
  static subscribeToGoals(callback) {
    return supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals'
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }

  // Unsubscribe from real-time updates
  static unsubscribe(channel) {
    supabase.removeChannel(channel);
  }
}