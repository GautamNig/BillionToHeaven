// src/components/DonationThankYouTooltip.jsx
import React from 'react';
import './DonationThankYouTooltip.css';

export default function DonationThankYouTooltip({ donation, position, currentUser }) {
  const isCurrentUserDonation = currentUser && donation.user_email === currentUser.email;
  
  const username = donation.user_email ? donation.user_email.split('@')[0] : 'Anonymous';
  const amount = parseFloat(donation.amount);

  const getThankYouMessage = () => {
    if (isCurrentUserDonation) {
      return `Thanks for helping NuNu climb ${amount} stair${amount > 1 ? 's' : ''} closer to heaven! 🎉`;
    } else {
      return `${username} helped NuNu climb ${amount} stair${amount > 1 ? 's' : ''} closer to heaven! ✨`;
    }
  };

  // Convert percentage to viewport units for fixed positioning
  const tooltipStyle = {
    left: `${position.x}vw`,
    top: `${position.y}vh`,
    transform: 'translate(-50%, -50%)'
  };

  const bubbleClass = `tooltip-bubble ${isCurrentUserDonation ? 'current-user' : 'other-user'}`;

  return (
    <div className="donation-tooltip" style={tooltipStyle}>
      <div className={bubbleClass}>
        <div className="message-header">
          <span className="username">{username}</span>
          <span className="donation-amount">
            ${amount}
          </span>
        </div>
        <div className="message-content">
          {getThankYouMessage()}
        </div>
      </div>
    </div>
  );
}