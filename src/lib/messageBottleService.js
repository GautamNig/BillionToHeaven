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
    static async createBottle(donationId, messageData, inventoryId) {
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
                inventory_id: inventoryId,
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
            
            // STEP 1: Try to serve this bottle to someone in queue
            await this.serveFloatingBottleToQueue(data.id, donation.user_id);
            
            return data;
            
        } catch (error) {
            console.error('Error creating message bottle:', error);
            throw error;
        }
    }
    
    /**
     * Try to serve a floating bottle to someone in queue
     * MINIMAL QUEUE INTEGRATION - STEP 1
     */
    static async serveFloatingBottleToQueue(bottleId, dropperUserId = null) {
        try {
            console.log(`🏺 Queue: Checking if bottle ${bottleId} can be served to queue`);
            
            // Find next person in queue (excluding the dropper if they're in queue)
            let query = supabase
                .from('bottle_queue_entries')
                .select('*')
                .eq('status', 'waiting')
                .order('queue_position', { ascending: true })
                .limit(1);
            
            if (dropperUserId) {
                query = query.neq('user_id', dropperUserId);
            }
            
            const { data: nextInQueue, error } = await query.maybeSingle();
            
            if (error) {
                console.error('❌ Queue query error:', error);
                return null;
            }
            
            if (!nextInQueue) {
                console.log('ℹ️ Queue: No one waiting in queue, bottle floats');
                return null;
            }
            
            console.log(`✅ Queue: Serving bottle to user ${nextInQueue.user_id} at position ${nextInQueue.queue_position}`);
            
            // Update bottle status
            const { error: bottleError } = await supabase
                .from('message_bottles')
                .update({
                    status: 'found',
                    finder_donation_id: nextInQueue.donation_id,
                    found_at: new Date().toISOString()
                })
                .eq('id', bottleId);
            
            if (bottleError) throw bottleError;
            
            // Update queue entry
            const { error: queueError } = await supabase
                .from('bottle_queue_entries')
                .update({
                    status: 'served',
                    served_at: new Date().toISOString()
                })
                .eq('id', nextInQueue.id);
            
            if (queueError) throw queueError;
            
            // Send notification (we'll implement this properly later)
            console.log(`🔔 Queue: Bottle ${bottleId} served to user ${nextInQueue.user_id}`);
            
            return {
                served: true,
                userId: nextInQueue.user_id,
                queuePosition: nextInQueue.queue_position
            };
            
        } catch (error) {
            console.error('❌ Queue: Error serving bottle to queue:', error);
            return null;
        }
    }
    
    /**
     * Find a random floating bottle for a donor
     * @param {string} finderDonationId - The donation ID of the finder
     * @returns {Promise<object|null>} Found bottle or null
     */
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
            .select('allow_reply, sender_donation_id, donations!sender_donation_id(user_id)')
            .eq('id', bottleId)
            .single();
        
        if (bottleError) throw bottleError;
        
        if (!bottle.allow_reply) {
            throw new Error('This bottle does not allow replies');
        }
        
        // Check if this user already replied to this bottle
        const { data: existingReplies, error: existingError } = await supabase
            .from('bottle_replies')
            .select('id')
            .eq('bottle_id', bottleId)
            .eq('sender_donation_id', donationId);
        
        if (existingError) throw existingError;
        
        if (existingReplies && existingReplies.length > 0) {
            throw new Error('You have already replied to this bottle. Only one reply per person is allowed.');
        }
        
        // Check if the replier is the original sender (prevent replying to own bottle)
        if (bottle.sender_donation_id === donationId) {
            throw new Error('You cannot reply to your own bottle.');
        }
        
        // REMOVE reply_number field since it doesn't exist in database
        const replyData = {
            bottle_id: bottleId,
            sender_donation_id: donationId,
            message: message,
            is_anonymous: isAnonymous
        };
        
        const { data: reply, error: replyError } = await supabase
            .from('bottle_replies')
            .insert([replyData])
            .select(`
                *,
                sender_donation:donations!sender_donation_id(amount, user_email)
            `)
            .single();
        
        if (replyError) {
            // Check if it's a unique constraint violation
            if (replyError.message && replyError.message.includes('unique constraint')) {
                throw new Error('You have already replied to this bottle. Only one reply per person is allowed.');
            }
            throw replyError;
        }
        
        // Create a notification for the bottle sender
        await this.createReplyNotification(bottleId, reply.id, bottle.sender_donation_id, bottle.donations?.user_id);
        
        return reply;
        
    } catch (error) {
        console.error('Error adding reply:', error);
        throw error;
    }
}

/**
 * Create a notification for the bottle sender when someone replies
 * @param {string} bottleId - Bottle ID
 * @param {string} replyId - Reply ID
 * @param {string} senderDonationId - Original sender's donation ID
 * @param {string} senderUserId - Original sender's user ID
 */
static async createReplyNotification(bottleId, replyId, senderDonationId, senderUserId) {
    try {
        if (!senderUserId) {
            // Get user ID from donation
            const { data: donation } = await supabase
                .from('donations')
                .select('user_id')
                .eq('id', senderDonationId)
                .single();
            
            if (donation) {
                senderUserId = donation.user_id;
            }
        }
        
        if (!senderUserId) {
            console.warn('Could not find sender user ID for reply notification');
            return;
        }
        
        console.log(`🔔 Creating reply notification for user ${senderUserId}`);
        
        // We could create a notification table, but for now let's use bottle status
        // or create a simple notification system
        
        // Option 1: Update bottle status to show it has replies
        await supabase
            .from('message_bottles')
            .update({
                has_replies: true,
                last_reply_at: new Date().toISOString()
            })
            .eq('id', bottleId);
        
        // Option 2: Log the notification (we'll implement proper notifications later)
        console.log(`💌 Reply sent to bottle ${bottleId}, sender ${senderUserId} should be notified`);
        
    } catch (error) {
        console.error('Error creating reply notification:', error);
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