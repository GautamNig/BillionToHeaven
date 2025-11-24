// src/hooks/useThankYouMessages.js
import { useState } from 'react';
import { AppSettings } from '../config/settings';

const DONATION_MESSAGES_CONFIG = {
    POSITIONS: [
        { x: 50, y: 20 },  // Top center  
        { x: 50, y: 90 },  // Bottom center
    ]
};

export default function useThankYouMessages() {
    const [donationMessages, setDonationMessages] = useState([]);

    const showThankYouMessage = (donation) => {
        const messageId = `donation-${donation.id}-${Date.now()}`;
        const randomPosition = DONATION_MESSAGES_CONFIG.POSITIONS[
            Math.floor(Math.random() * DONATION_MESSAGES_CONFIG.POSITIONS.length)
        ];

        const messageWithPosition = {
            ...donation,
            id: messageId,
            position: randomPosition
        };

        setDonationMessages(prev => [...prev, messageWithPosition]);

        setTimeout(() => {
            setDonationMessages(prev => prev.filter(msg => msg.id !== messageId));
        }, AppSettings.DONATION_MESSAGES.DISPLAY_DURATION);
    };

    const removeThankYouMessage = (messageId) => {
        setDonationMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    return {
        donationMessages,
        showThankYouMessage,
        removeThankYouMessage
    };
}