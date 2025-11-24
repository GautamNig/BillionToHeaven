// src/config/uiStrings.js - CENTRALIZED UI STRINGS & MESSAGES

export const UIStrings = {
  // ========================
  // GENERAL & COMMON STRINGS
  // ========================
  GENERAL: {
    APP_NAME: "BillionToHeaven",
    LOADING: "Loading...",
    ERROR: "Error",
    SUCCESS: "Success",
    ANONYMOUS: "Anonymous",
    UNKNOWN: "Unknown",
    YOU: "You"
  },

  // ========================
  // AUTHENTICATION STRINGS
  // ========================
  AUTH: {
    SIGN_IN: "🔐 Sign In",
    SIGN_OUT: "Sign Out",
    WELCOME: "Welcome",
    GUEST: "Guest"
  },

  // ========================
  // DONATION STRINGS
  // ========================
  DONATION: {
    TITLE: "💝 Donate",
    CHOOSE_AMOUNT: "Choose donation amount:",
    CUSTOM_AMOUNT: "💫 Custom Amount",
    ENTER_CUSTOM_AMOUNT: "Enter Custom Amount",
    MINIMUM_DONATION: "Minimum donation is $1",
    ENTER_AMOUNT_PROMPT: "Enter an amount to see PayPal options",
    CANCEL: "Cancel",
    
    // Amount descriptions
    STAIR_CONVERSION: (amount) => `$${amount} = ${amount} stair${amount > 1 ? 's' : ''}`,
    PAYPAL_DESCRIPTION: (amount) => `Donation for ${amount} stair${amount > 1 ? 's' : ''}`,
    
    // Success messages
    DONATION_RECEIVED: (amount) => `Donation received: $${amount}`,
    CLIMBING_STATUS: (amount) => `🎯 Climbing ${amount} stair${amount > 1 ? 's' : ''}...`,
    HELPED_CLIMB: (amount, isCurrentUser) => 
      `Helped NuNu climb ${amount} stair${amount > 1 ? 's' : ''} ${isCurrentUser ? '🎉' : '✨'}`
  },

  // ========================
  // GOAL & PROGRESS STRINGS
  // ========================
  GOAL: {
    RAISED_OF_GOAL: (raised, goal) => `Raised of $${raised} goal`,
    PERCENT_FUNDED: (percentage) => `${percentage}% funded`,
    FUNDED: "funded"
  },

  // ========================
  // HISTORY & ACTIVITY STRINGS
  // ========================
  HISTORY: {
    RECENT_DONATIONS: "Recent Donations",
    RECENT_ACTIVITY: "Recent Activity",
    NO_DONATIONS_YET: "No donations yet. Be the first to help NuNu climb! 🎉",
    DONATION_COUNT: (count) => `${count}`,
    TIME_AGO: {
      JUST_NOW: "Just now",
      MINUTES_AGO: (mins) => `${mins}m ago`,
      HOURS_AGO: (hours) => `${hours}h ago`
    }
  },

  // ========================
  // HOW IT WORKS SECTION
  // ========================
  HOW_IT_WORKS: {
    TITLE: "✨ Help is heaven !! 🌟",
    HEADER_TITLE: "🎯 NuNu's Epic Adventure to Heaven ⚡",
    SUBHEADER: "Every donation brings us closer to the magical door!",
    
    STEPS: {
      STEP1: {
        TITLE: "Magic Conversion",
        DESCRIPTION: "Every <strong>$1</strong> magically transforms into <strong>1 stair</strong> for NuNu to climb!",
        EMOJI: "💰"
      },
      STEP2: {
        TITLE: "Heartfelt Impact", 
        DESCRIPTION: "<strong>50%</strong> of all received donations directly support Humans, Animals, and Trees in need.",
        EMOJI: "🌍"
      },
      STEP3: {
        TITLE: "Pay It Forward",
        DESCRIPTION: "When NuNu reaches heaven, <strong>YOU</strong> could be next! NuNu will help donors raise funds for their chosen causes.",
        EMOJI: "🔄"
      },
      STEP4: {
        TITLE: "Give with Joy",
        DESCRIPTION: "Donate only what feels light and joyful. Let love flow through you effortlessly.",
        EMOJI: "💖"
      }
    },
    
    CALL_TO_ACTION: {
      TITLE: "🚀 Join the Magical Journey! 🌈",
      SUBTITLE: "Every step brings magic to the world"
    }
  },

  // ========================
  // DOOR & ANIMATION STRINGS
  // ========================
  DOOR: {
    ALT_TEXT: "Fantasy World Door",
    LOADING_TEXT: "🏰 Loading Heaven's Door...",
    HEAVENS_DOOR: "Heaven's Door"
  },

  // ========================
  // ANIMATION & RIVE STRINGS
  // ========================
  ANIMATION: {
    LOADING: "⚡ Loading Animation...",
    CLIMBING: (amount) => `Climbing ${amount} stairs`,
    ANIMATION_COMPLETED: "Animation completed"
  },

  // ========================
  // PAYMENT & PAYPAL STRINGS
  // ========================
  PAYMENT: {
    PAYPAL_LOADING: "Loading PayPal...",
    PAYPAL_FAILED: "PayPal failed to load",
    CURRENCY: "USD",
    CURRENCY_CODE: "USD"
  },

  // ========================
  // DEBUG & LOGGING STRINGS
  // ========================
  DEBUG: {
    RIVE_LOADED: "✅ Rive animation loaded",
    RIVE_ERROR: "❌ Rive loading error:",
    DOOR_IMAGE_LOADED: "✅ Door image loaded",
    DOOR_IMAGE_ERROR: "❌ Failed to load door image",
    DONATION_APPROVED: "🎉 PayPal donation approved:",
    PAYPAL_ERROR: "❌ PayPal error:",
    REAL_TIME_EVENT: "📡 Real-time donation event:",
    NEW_DONATION: "💫 New donation detected:",
    DONATION_SUCCESS: "💰 Donation success:",
    DONATION_SAVED: "💾 Donation saved to DB:",
    REFRESHING_DATA: "🔄 Force refreshing ALL UI data...",
    DATA_REFRESHED: "✅ ALL UI data force refreshed",
    STARTING_ANIMATION: (stairs, duration) => `⏱️ Starting animation: ${stairs} stairs for ${duration} seconds`,
    CLIMBING_ANIMATION: (amount, duration) => `Climbing ${amount} stairs for ${duration}s`,
    SIGNED_OUT: "👋 User signed out successfully",
    SIGN_OUT_ERROR: "❌ Failed to sign out:",
    RIVE_INITIALIZED: "🔄 Rive instance available",
    STATE_MACHINE_INPUTS: "🔍 State Machine Inputs:",
    DIRECTION_INPUT_FOUND: "✅ Direction input found",
    MOUSE_DISABLED: "✅ Mouse interactions disabled on Rive canvas",
    STARTING_CLIMB: "🎬 Starting climbing animation...",
    NO_DIRECTION_INPUT: "❌ No direction input reference",
    SETTING_DIRECTION: (value) => `🎯 Setting direction to ${value}`,
    DIRECTION_SET: (value) => `✅ Direction set to ${value}`,
    ANIMATION_ERROR: "❌ Error controlling animation:",
    LOADING_DATA: "📥 Loading initial data...",
    DATA_LOADED: "✅ Initial data loaded successfully",
    LOADING_ERROR: "❌ Error loading initial data:",
    REAL_TIME_SUBSCRIBING: "🎯 Setting up real-time subscription...",
    REAL_TIME_CLEANUP: "🧹 Cleaning up real-time subscription",
    SHOWING_MESSAGE: "💌 Showing thank you message for OTHER user",
    SKIPPING_MESSAGE: "🔄 Skipping message - our own donation (handled locally)",
    PLAYING_REMOTE_ANIMATION: (amount) => `🎬 Playing remote animation: $${amount}`,
    SKIPPING_OWN_ANIMATION: "🔄 Skipping animation - our own donation",
    SKIPPING_ALREADY_CLIMBING: "⏳ Skipping animation - already climbing",
    PROCESSING_DONATION_ERROR: "❌ Error processing donation:"
  },

  // ========================
  // ATTRIBUTION STRINGS
  // ========================
  ATTRIBUTION: {
    ANIMATION: "🎨 Animation:",
    BY: "by",
    CREATOR: "Marcelo Bazani",
    LICENSE: "CC BY 4.0",
    VIEW_ON_RIVE: "View on Rive",
    RIVE_URL: "https://rive.app/community/8866-17054-stairs-marcelo-bazani",
    LICENSE_URL: "https://creativecommons.org/licenses/by/4.0/"
  }
};

// Helper function to get username from email
export const getUsername = (email) => {
  if (!email) return UIStrings.GENERAL.ANONYMOUS;
  return email.split('@')[0];
};

// Helper function to format time ago
export const formatTimeAgo = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return UIStrings.HISTORY.TIME_AGO.JUST_NOW;
  if (diffMins < 60) return UIStrings.HISTORY.TIME_AGO.MINUTES_AGO(diffMins);
  if (diffHours < 24) return UIStrings.HISTORY.TIME_AGO.HOURS_AGO(diffHours);
  return date.toLocaleDateString();
};

// Make strings globally accessible for debugging
if (typeof window !== 'undefined') {
  window.BillionToHeavenStrings = UIStrings;
  console.log('📝 BillionToHeaven UI Strings Loaded:', UIStrings);
}