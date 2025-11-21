// src/lib/donationsService.js
import { supabase } from './supabase';

export class DonationsService {
  
  // Add a new donation
  static async addDonation(amount, userId = null, userEmail = null) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .insert([
          {
            amount: amount,
            user_id: userId,
            user_email: userEmail,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding donation:', error);
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