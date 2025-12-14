// src/lib/messageBottleService.js
import { supabase } from './supabase';
import { getBottleColor } from '../utils/bottleUtils';

export class MessageBottleService {
    
    /**
     * Create a new message bottle after donation
     * @param {string} donationId - The donation ID
     * @param {object} messageData - Message content and options
     * @returns {Promise<object>} Created bottle
     */
    static async createBottle(donationId, messageData, inventoryId) {  // ADD inventoryId parameter
    try {
        // Get donation details for metadata
        const { data: donation, error: donationError } = await supabase
            .from('donations')
            .select('amount, user_id, user_email')
            .eq('id', donationId)
            .single();
        
        if (donationError) throw donationError;
        
        const bottleData = {
            sender_donation_id: donationId,
            inventory_id: inventoryId,  // ADD THIS
            message: messageData.message,
            is_anonymous: messageData.isAnonymous !== false,
            show_donation_amount: messageData.showDonationAmount || false,
            allow_reply: messageData.allowReply !== false,
            bottle_color: getBottleColor(donation.amount),
            status: 'floating'
        };
        
        const { data, error } = await supabase
            .from('message_bottles')
            .insert([bottleData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
        
    } catch (error) {
        console.error('Error creating message bottle:', error);
        throw error;
    }
}
    
    /**
     * Find a random floating bottle for a donor
     * @param {string} finderDonationId - The donation ID of the finder
     * @returns {Promise<object|null>} Found bottle or null
     */
    // Update MessageBottleService.findRandomBottle
static async findRandomBottle(finderDonationId, finderUserId = null) {
    try {
        // Get a random floating bottle that's NOT from the finder
        let query = supabase
            .from('message_bottles')
            .select('*')
            .eq('status', 'floating');
        
        // Exclude user's own bottles if user is authenticated
        if (finderUserId) {
            // Get all donation IDs from this user
            const { data: userDonations } = await supabase
                .from('donations')
                .select('id')
                .eq('user_id', finderUserId);
            
            if (userDonations && userDonations.length > 0) {
                const userDonationIds = userDonations.map(d => d.id);
                query = query.not('sender_donation_id', 'in', `(${userDonationIds.join(',')})`);
            }
        }
        
        const { data: bottles, error } = await query
            .order('created_at', { ascending: true })
            .limit(1);
        
        if (error) throw error;
        
        if (!bottles || bottles.length === 0) {
            return null;
        }
        
        const bottle = bottles[0];
        
        // Update bottle status
        const { data: updatedBottle, error: updateError } = await supabase
            .from('message_bottles')
            .update({
                status: 'found',
                finder_donation_id: finderDonationId,
                found_at: new Date().toISOString()
            })
            .eq('id', bottle.id)
            .select()
            .single();
        
        if (updateError) throw updateError;
        
        return updatedBottle;
        
    } catch (error) {
        console.error('Error finding random bottle:', error);
        throw error;
    }
}
    
    /**
     * Get bottles for a user (sent and found)
     * @param {string} userId - User ID
     * @returns {Promise<object>} User's bottles
     */
    // Update the getUserBottles function in messageBottleService.js
static async getUserBottles(userId) {
    try {
        // First, get donation IDs for this user
        const { data: userDonations, error: donationsError } = await supabase
            .from('donations')
            .select('id')
            .eq('user_id', userId);
        
        if (donationsError) throw donationsError;
        
        if (!userDonations || userDonations.length === 0) {
            return {
                sent: [],
                found: [],
                unreadCount: 0
            };
        }
        
        const donationIds = userDonations.map(d => d.id);
        
        // Get bottles sent by user
        const { data: sentBottles, error: sentError } = await supabase
            .from('message_bottles')
            .select(`
                *,
                donations!sender_donation_id (amount, created_at)
            `)
            .in('sender_donation_id', donationIds);
        
        if (sentError) throw sentError;
        
        // Get bottles found by user
        const { data: foundBottles, error: foundError } = await supabase
            .from('message_bottles')
            .select(`
                *,
                donations!sender_donation_id (amount, created_at, user_email),
                finder_donation:donations!finder_donation_id (amount, created_at)
            `)
            .in('finder_donation_id', donationIds);
        
        if (foundError) throw foundError;
        
        return {
            sent: sentBottles || [],
            found: foundBottles || [],
            unreadCount: (foundBottles || []).filter(b => b.status === 'found').length
        };
        
    } catch (error) {
        console.error('Error getting user bottles:', error);
        throw error;
    }
}
    
    /**
     * Mark a bottle as read
     * @param {string} bottleId - Bottle ID
     * @returns {Promise<object>} Updated bottle
     */
    static async markBottleAsRead(bottleId) {
        try {
            const { data, error } = await supabase
                .from('message_bottles')
                .update({
                    status: 'read',
                    read_at: new Date().toISOString()
                })
                .eq('id', bottleId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Error marking bottle as read:', error);
            throw error;
        }
    }
    
    /**
     * Get bottle with replies
     * @param {string} bottleId - Bottle ID
     * @returns {Promise<object>} Bottle with replies
     */
    static async getBottleWithReplies(bottleId) {
        try {
            const { data: bottle, error: bottleError } = await supabase
                .from('message_bottles')
                .select(`
                    *,
                    sender_donation:donations!sender_donation_id (amount, created_at, user_email),
                    finder_donation:donations!finder_donation_id (amount, created_at, user_email)
                `)
                .eq('id', bottleId)
                .single();
            
            if (bottleError) throw bottleError;
            
            const { data: replies, error: repliesError } = await supabase
                .from('bottle_replies')
                .select(`
                    *,
                    sender_donation:donations!sender_donation_id (amount, created_at, user_email)
                `)
                .eq('bottle_id', bottleId)
                .order('created_at', { ascending: true });
            
            if (repliesError) throw repliesError;
            
            return {
                ...bottle,
                replies: replies || []
            };
            
        } catch (error) {
            console.error('Error getting bottle with replies:', error);
            throw error;
        }
    }
    
    /**
     * Add a reply to a bottle
     * @param {string} bottleId - Bottle ID
     * @param {string} donationId - Reply sender's donation ID
     * @param {string} message - Reply message
     * @param {boolean} isAnonymous - Whether reply is anonymous
     * @returns {Promise<object>} Created reply
     */
    static async addReply(bottleId, donationId, message, isAnonymous = true) {
        try {
            // Check if bottle allows replies
            const { data: bottle, error: bottleError } = await supabase
                .from('message_bottles')
                .select('allow_reply')
                .eq('id', bottleId)
                .single();
            
            if (bottleError) throw bottleError;
            
            if (!bottle.allow_reply) {
                throw new Error('This bottle does not allow replies');
            }
            
            const replyData = {
                bottle_id: bottleId,
                sender_donation_id: donationId,
                message: message,
                is_anonymous: isAnonymous
            };
            
            const { data, error } = await supabase
                .from('bottle_replies')
                .insert([replyData])
                .select()
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            console.error('Error adding reply:', error);
            throw error;
        }
    }
    
    /**
     * Subscribe to bottle updates for a user
     * @param {string} userId - User ID
     * @param {Function} callback - Callback function
     * @returns {object} Subscription
     */
    static subscribeToUserBottles(userId, callback) {
    // We need to get donation IDs first
    return supabase
        .channel('user-bottles')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'message_bottles' 
            },
            async (payload) => {
                // Filter in callback to check if this bottle belongs to user
                try {
                    const userDonations = await supabase
                        .from('donations')
                        .select('id')
                        .eq('user_id', userId);
                    
                    if (userDonations.data) {
                        const donationIds = userDonations.data.map(d => d.id);
                        const bottle = payload.new;
                        
                        // Check if this bottle belongs to user
                        if (donationIds.includes(bottle.sender_donation_id) || 
                            donationIds.includes(bottle.finder_donation_id)) {
                            callback(payload);
                        }
                    }
                } catch (error) {
                    console.error('Error in bottle subscription filter:', error);
                }
            }
        )
        .subscribe();
}
}