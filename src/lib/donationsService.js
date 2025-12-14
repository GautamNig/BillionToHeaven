// src/lib/donationsService.js
import { supabase } from './supabase';
import { MessageBottleService } from './messageBottleService';


export class DonationsService {
  
  // Add a new donation
  static async addDonation(amount, userId = null, userEmail = null) {
    try {
        const donationData = {
            amount: parseFloat(amount),
            user_id: userId,
            user_email: userEmail,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('donations')
            .insert([donationData])
            .select()
            .single();

        if (error) throw error;

        // Add empty bottle to user's inventory
        if (userId) {
            await this.addBottleToInventory(userId, data.id);
        }

        // Try to find a random bottle (excluding user's own)
        try {
            const foundBottle = await MessageBottleService.findRandomBottle(data.id, userId);
            if (foundBottle) {
                console.log('Found bottle:', foundBottle.id);
            }
        } catch (bottleError) {
            console.warn('Could not find bottle:', bottleError);
        }

        return data;
    } catch (error) {
        console.error('Error adding donation:', error);
        throw error;
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