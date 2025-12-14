// src/utils/bottleUtils.js

/**
 * Get bottle color based on donation amount
 * @param {number} amount - Donation amount
 * @returns {string} Color name
 */
export function getBottleColor(amount) {
    if (amount < 5) return 'blue';
    if (amount < 20) return 'green';
    if (amount < 50) return 'purple';
    if (amount < 100) return 'gold';
    return 'rainbow';
}

/**
 * Get color CSS value
 * @param {string} colorName - Color name
 * @returns {string} CSS color value
 */
export function getColorValue(colorName) {
    const colors = {
        blue: '#4a90e2',
        green: '#6bcf7f',
        purple: '#8a7fff',
        gold: '#ffd93d',
        rainbow: 'linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f, #4a90e2, #8a7fff)'
    };
    return colors[colorName] || colors.blue;
}

/**
 * Format bottle display info based on anonymity settings
 * @param {object} bottle - Bottle object
 * @returns {object} Display info
 */
export function getBottleDisplayInfo(bottle, donation) {
    if (bottle.is_anonymous) {
        return {
            sender: 'Anonymous Sailor',
            amount: bottle.show_donation_amount && donation ? `$${donation.amount}` : null,
            displayText: bottle.show_donation_amount && donation 
                ? `From an anonymous donor ($${donation.amount})`
                : 'From an anonymous donor'
        };
    }
    
    // Non-anonymous
    const email = donation?.user_email || 'Unknown';
    const username = email.split('@')[0];
    return {
        sender: username,
        amount: donation ? `$${donation.amount}` : null,
        displayText: bottle.show_donation_amount && donation
            ? `From ${username} ($${donation.amount})`
            : `From ${username}`
    };
}

/**
 * Generate a random ocean position for bottle animation
 * @returns {object} Position coordinates
 */
export function getRandomOceanPosition() {
    return {
        x: Math.random() * 70 + 15, // 15% to 85%
        y: Math.random() * 60 + 20  // 20% to 80%
    };
}

/**
 * Format timestamp to relative time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Relative time string
 */
export function formatBottleTime(timestamp) {
    if (!timestamp) return 'Recently';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}