// Update src/components/MessageBottleModal.jsx
import React, { useState } from 'react';
import { UIStrings } from '../config/uiStrings';
import { getColorValue } from '../utils/bottleUtils';

const MessageBottleModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    donationAmount,
    isLoading = false,
    user
}) => {
    const [message, setMessage] = useState('');
    const [options, setOptions] = useState({
        isAnonymous: true,
        showDonationAmount: false,
        allowReply: true
    });
    
    const [charCount, setCharCount] = useState(0);
    const maxChars = 280;
    
    const handleMessageChange = (e) => {
        const text = e.target.value;
        if (text.length <= maxChars) {
            setMessage(text);
            setCharCount(text.length);
        }
    };
    
    const handleOptionChange = (option) => {
        setOptions(prev => ({
            ...prev,
            [option]: !prev[option]
        }));
    };
    
    const handleSubmit = () => {
        if (message.trim() && !isLoading) {
            onSubmit(message, options);
        }
    };
    
    const handleSkip = () => {
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a0b3a, #2b0c5c)',
                borderRadius: '20px',
                padding: '25px',
                width: '90%',
                maxWidth: '450px', // Reduced from 500px
                maxHeight: '85vh', // Limit height
                overflowY: 'auto', // Make scrollable if needed
                border: '2px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Ocean Wave Decoration */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #4a90e2, #6bcf7f, #8a7fff, #ffd93d)',
                    opacity: 0.7,
                    borderRadius: '20px 20px 0 0'
                }} />
                
                {/* Thank You Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    paddingBottom: '15px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        margin: '0 auto 15px',
                        background: 'linear-gradient(135deg, #4a90e2, #8a7fff)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        🎉
                    </div>
                    
                    <h2 style={{
                        color: '#ffd93d',
                        margin: 0,
                        fontSize: '22px',
                        marginBottom: '5px'
                    }}>
                        Thank You for Your Donation!
                    </h2>
                    
                    <div style={{
                        color: '#ffd93d',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '10px'
                    }}>
                        ${donationAmount}
                    </div>
                    
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '1.5'
                    }}>
                        As a gesture of thanks, here's an empty bottle.
                        <br />
                        Fill it with a message and throw it in the ocean for another donor to discover!
                    </p>
                </div>
                
                {/* Bottle Illustration */}
                <div style={{
                    position: 'relative',
                    margin: '0 auto 20px',
                    width: '80px',
                    height: '120px',
                    background: 'linear-gradient(to bottom, #4a90e2, #2b5f9e)',
                    borderRadius: '5px 5px 30px 30px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 -10px 20px rgba(0, 0, 0, 0.3)',
                    animation: 'float 4s ease-in-out infinite'
                }}>
                    {/* Bottle neck */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        width: '30px',
                        height: '25px',
                        background: 'linear-gradient(to bottom, #4a90e2, #2b5f9e)',
                        borderRadius: '5px 5px 0 0',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderBottom: 'none'
                    }} />
                    
                    {/* Bottle cork */}
                    <div style={{
                        position: 'absolute',
                        top: '-25px',
                        width: '20px',
                        height: '10px',
                        background: 'linear-gradient(to bottom, #8B4513, #654321)',
                        borderRadius: '3px'
                    }} />
                    
                    {/* Message inside bottle */}
                    <div style={{
                        position: 'absolute',
                        bottom: '15px',
                        width: '60px',
                        height: '40px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '3px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(-2deg)'
                    }}>
                        <div style={{
                            width: '50px',
                            height: '30px',
                            background: 'linear-gradient(45deg, #fff8dc, #fffacd)',
                            borderRadius: '2px',
                            border: '1px dashed rgba(139, 69, 19, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#8B4513'
                        }}>
                            📜
                        </div>
                    </div>
                    
                    {/* Water level */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: '30px',
                        background: 'rgba(74, 144, 226, 0.6)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                    }} />
                </div>
                
                {/* Message Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{
                        display: 'block',
                        color: 'rgba(255, 255, 255, 0.9)',
                        marginBottom: '10px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        Your Message for the Next Donor (max {maxChars} chars)
                    </label>
                    <textarea
                        value={message}
                        onChange={handleMessageChange}
                        placeholder="Write an encouraging message, a secret, or share why you donated..."
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '12px',
                            padding: '12px',
                            color: 'white',
                            fontSize: '14px',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: '1.5'
                        }}
                        onFocus={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.target.style.borderColor = '#ffd93d';
                        }}
                        onBlur={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '5px'
                    }}>
                        <span style={{
                            color: charCount > maxChars * 0.9 ? '#ff6b6b' : 'rgba(255, 255, 255, 0.6)',
                            fontSize: '12px'
                        }}>
                            {charCount}/{maxChars}
                        </span>
                        {charCount > 0 && charCount < 20 && (
                            <span style={{
                                color: '#ff6b6b',
                                fontSize: '12px'
                            }}>
                                Consider writing a bit more
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Bottle Options - Compact Version */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '14px',
                        margin: '0 0 12px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>⚙️</span> Bottle Settings
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={options.isAnonymous}
                                onChange={() => handleOptionChange('isAnonymous')}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                                Send anonymously 🎭
                            </span>
                        </label>
                        
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={options.showDonationAmount}
                                onChange={() => handleOptionChange('showDonationAmount')}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                                Show donation amount (${donationAmount}) 💰
                            </span>
                        </label>
                        
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer'
                        }}>
                            <input
                                type="checkbox"
                                checked={options.allowReply}
                                onChange={() => handleOptionChange('allowReply')}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer'
                                }}
                            />
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px' }}>
                                Allow finder to reply 🔄
                            </span>
                        </label>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={handleSkip}
                        disabled={isLoading}
                        style={{
                            padding: '12px 20px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.6 : 1,
                            transition: 'all 0.3s ease',
                            flex: 1
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading) {
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        Skip for Now
                    </button>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={!message.trim() || isLoading}
                        style={{
                            padding: '12px 20px',
                            background: message.trim() && !isLoading 
                                ? 'linear-gradient(135deg, #4a90e2, #8a7fff)' 
                                : 'rgba(255, 255, 255, 0.1)',
                            color: message.trim() && !isLoading ? 'white' : 'rgba(255, 255, 255, 0.3)',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: message.trim() && !isLoading ? 'pointer' : 'not-allowed',
                            opacity: isLoading ? 0.6 : 1,
                            transition: 'all 0.3s ease',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseOver={(e) => {
                            if (message.trim() && !isLoading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(138, 127, 255, 0.3)';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        {isLoading ? (
                            <>Sending...</>
                        ) : (
                            <>
                                Throw Bottle 🌊
                            </>
                        )}
                    </button>
                </div>
                
                {/* Help Text */}
                <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        margin: 0,
                        textAlign: 'center'
                    }}>
                        Your bottle will float in the ocean until discovered.
                        <br />
                        You'll be notified if someone finds and replies to your message.
                    </p>
                </div>
                
                {/* Close Button */}
                <button
                    onClick={handleSkip}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default MessageBottleModal;