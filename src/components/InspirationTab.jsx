// src/components/InspirationTab.jsx - SIMPLIFIED VERSION
import React, { useState } from 'react';

const InspirationTab = ({ isOpen, onClose }) => {
    const [activeSection, setActiveSection] = useState('why-donate');

    const sections = {
        'why-donate': {
            title: "🌟 Why Donate?",
            content: (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: '#FFD93D', fontSize: '24px', marginBottom: '15px' }}>
                            Help Me Build Wealth<br/>The Right Way
                        </h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', lineHeight: '1.6' }}>
                            An alternative to corporate exploitation & Unemployment.<br/>
                            Join me.
                        </p>
                    </div>

                    {/* SIMPLE 50/50 MODEL */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '25px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{
                                display: 'inline-block',
                                background: 'rgba(107, 207, 127, 0.2)',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                color: '#6bcf7f',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                50/50 Split - Full Transparency
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    background: 'rgba(255, 107, 107, 0.1)',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                    fontSize: '24px'
                                }}>
                                    💰
                                </div>
                                <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>Your $10</div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                →
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    background: 'rgba(107, 207, 127, 0.1)',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                    fontSize: '24px'
                                }}>
                                    🤝
                                </div>
                                <div style={{ color: '#6bcf7f', fontSize: '12px', fontWeight: 'bold' }}>Half Helps Others</div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                +
                            </div>
                            
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    background: 'rgba(255, 215, 61, 0.1)',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                    fontSize: '24px'
                                }}>
                                    🏃
                                </div>
                                <div style={{ color: '#ffd93d', fontSize: '12px', fontWeight: 'bold' }}>Half Helps Me Escape</div>
                            </div>
                        </div>

                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', textAlign: 'center' }}>
                            I keep half to survive, give half away to help others.<br/>
                        </p>
                    </div>

                    {/* SIMPLE CHOICE */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '25px'
                    }}>
                        <h3 style={{ color: '#ffd93d', marginBottom: '15px', textAlign: 'center' }}>
                            Making helping my profession.
                        </h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            
                            <div style={{
                                background: 'rgba(107, 207, 127, 0.1)',
                                padding: '12px',
                                borderRadius: '8px'
                            }}>
                                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                                    Your money helps people & animals directly
                                </div>
                            </div>
                        </div>
                        
                        <div style={{
                            background: 'rgba(255, 215, 61, 0.1)',
                            padding: '10px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#ffd93d', fontSize: '12px' }}>
                                <strong>Starts at</strong><br/>
                                (Less than your daily coffee)
                            </div>
                        </div>
                    </div>

                    {/* BONUS: MESSAGE BOTTLES */}
                    <div style={{
                        background: 'rgba(138, 127, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ fontSize: '28px', color: '#8a7fff' }}>🏺</div>
                            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                                Bonus: Digital Message Bottles
                            </div>
                        </div>
                        
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', textAlign: 'center' }}>
                            Every donation earns you a bottle to leave encouraging messages for other donors.<br/>
                            Spread joy. Receive surprises. Build connections.
                        </p>
                    </div>
                </>
            )
        },
        'spiritual': {
            title: "🙏 Spiritual View",
            content: (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: '#FFD93D', fontSize: '24px', marginBottom: '10px' }}>
                            Love Made Visible
                        </h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                            "God has no hands but ours"<br/>
                            - St. Teresa of Ávila
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '25px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🌱</div>
                            <div style={{ color: '#6bcf7f', fontSize: '16px', fontWeight: 'bold' }}>
                                The Mustard Seed Effect
                            </div>
                        </div>
                        
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', textAlign: 'center' }}>
                            "The kingdom of heaven is like a mustard seed...<br/>
                            Though it is the smallest of all seeds,<br/>
                            yet when it grows, it becomes the largest."<br/>
                            - Matthew 13:31-32
                        </p>
                        
                        <div style={{
                            background: 'rgba(255, 215, 61, 0.1)',
                            padding: '12px',
                            borderRadius: '8px',
                            marginTop: '15px'
                        }}>
                            <p style={{ color: '#ffd93d', fontSize: '13px', textAlign: 'center' }}>
                                Your donation, no matter how small,<br/>
                                grows into help for many through God's grace.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>🪽</div>
                            <div style={{ color: '#4a90e2', fontSize: '16px', fontWeight: 'bold' }}>
                                Building Jacob's Ladder
                            </div>
                        </div>
                        
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', textAlign: 'center' }}>
                            "A ladder set up on the earth,<br/>
                            and the top of it reached to heaven..."<br/>
                            - Genesis 28:12
                        </p>
                        
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px',
                            marginTop: '20px'
                        }}>
                            <div style={{ color: '#4a90e2', fontSize: '14px' }}>↑ HEAVEN ↑</div>
                            <div style={{
                                width: '150px',
                                height: '25px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '12px'
                            }}>
                                Your Prayer
                            </div>
                            <div style={{
                                width: '150px',
                                height: '25px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: '12px'
                            }}>
                                Your Donation
                            </div>
                            <div style={{ color: '#ffd93d', fontSize: '14px' }}>↓ EARTH ↓</div>
                        </div>
                    </div>
                </>
            )
        },
        'no-pressure': {
            title: "🎭 No Pressure",
            content: (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: '#FFD93D', fontSize: '24px', marginBottom: '10px' }}>
                            Seriously, No Pressure
                        </h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                            Give what feels good. That's it.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '25px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>☕</div>
                            <div style={{ color: '#6bcf7f', fontSize: '16px', fontWeight: 'bold' }}>
                                The Coffee Test
                            </div>
                        </div>
                        
                        <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', textAlign: 'center' }}>
                            Donate only what you'd spend on a fancy coffee.<br/>
                            If $5 feels too much, try $1.<br/>
                            If $1 feels too much, share instead.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        marginBottom: '25px'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>✨</div>
                            <div style={{ color: '#ffd93d', fontSize: '16px', fontWeight: 'bold' }}>
                                Small Amounts, Big Impact
                            </div>
                        </div>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            marginBottom: '15px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#ff6b6b', fontSize: '18px', fontWeight: 'bold' }}>1 person</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>$100 donation</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#6bcf7f', fontSize: '18px', fontWeight: 'bold' }}>100 people</div>
                                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>$1 donations</div>
                            </div>
                        </div>
                        
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', textAlign: 'center' }}>
                            Both create the same total impact.<br/>
                            But the second way feels better for everyone.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(74, 144, 226, 0.1)',
                        borderRadius: '12px',
                        padding: '20px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '36px', marginBottom: '10px' }}>💝</div>
                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', fontStyle: 'italic' }}>
                                "Give only what brings you joy.<br/>
                                Forced generosity helps no one."
                            </p>
                        </div>
                    </div>
                </>
            )
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div style={{
                position: 'fixed',
                top: '60px',
                right: 0,
                width: '400px',
                height: 'calc(100vh - 60px)',
                background: 'rgba(0, 0, 0, 0.98)',
                borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                zIndex: 1900,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
                animation: 'slideInRight 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>💫</span>
                        {sections[activeSection].title}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
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

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    padding: '10px 15px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    gap: '5px'
                }}>
                    {Object.entries({
                        'why-donate': '🌟 Why',
                        'spiritual': '🙏 Spiritual',
                        'no-pressure': '🎭 No Pressure'
                    }).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setActiveSection(key)}
                            style={{
                                flex: 1,
                                background: activeSection === key 
                                    ? 'linear-gradient(135deg, #FFD93D, #FF6B6B)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                color: activeSection === key ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 5px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {sections[activeSection].content}
                </div>
            </div>

            {/* Click outside to close */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: '400px',
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1899,
                    backdropFilter: 'blur(2px)'
                }}
            />
        </>
    );
};

export default InspirationTab;