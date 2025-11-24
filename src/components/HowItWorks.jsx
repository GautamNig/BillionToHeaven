// src/components/HowItWorks.jsx
import React from 'react';
import { UIStrings } from '../config/uiStrings';

const HowItWorks = () => {
    // Helper function to render HTML from UI strings
    const renderHTML = (htmlString) => {
        return { __html: htmlString };
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #2b0c5c, #4a1b9d)',
            overflowY: 'auto',
            padding: '40px 20px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}>
                
                {/* Hero Section */}
                <div style={{
                    padding: '50px 40px 40px',
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(138,127,255,0.2))',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        color: '#FFD93D',
                        fontSize: '36px',
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        textShadow: '0 4px 12px rgba(255,215,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px'
                    }}>
                        <span style={{ animation: 'pulse 2s infinite' }}>✨</span>
                        {UIStrings.HOW_IT_WORKS.TITLE}
                        <span style={{ animation: 'pulse 2s infinite 0.5s' }}>🌟</span>
                    </div>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '18px',
                        lineHeight: '1.6',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        {UIStrings.HOW_IT_WORKS.SUBHEADER}
                    </div>
                </div>

                {/* Content Section */}
                <div style={{
                    padding: '40px',
                    background: 'rgba(0, 0, 0, 0.4)'
                }}>
                    
                    {/* Steps Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        
                        {/* Step 1 - Money to Stairs */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            padding: '30px',
                            background: 'rgba(255, 217, 61, 0.1)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 217, 61, 0.3)',
                            transition: 'all 0.3s ease'
                        }} 
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 217, 61, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 217, 61, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, #FFD93D, #FF6B6B)',
                                borderRadius: '15px',
                                padding: '20px',
                                fontSize: '24px',
                                minWidth: '70px',
                                height: '70px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'bounce 3s infinite'
                            }}>
                                {UIStrings.HOW_IT_WORKS.STEPS.STEP1.EMOJI}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#FFD93D',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    marginBottom: '12px'
                                }}>
                                    {UIStrings.HOW_IT_WORKS.STEPS.STEP1.TITLE}
                                </div>
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '18px',
                                    lineHeight: '1.6'
                                }} dangerouslySetInnerHTML={renderHTML(UIStrings.HOW_IT_WORKS.STEPS.STEP1.DESCRIPTION)} />
                            </div>
                        </div>

                        {/* Step 2 - Charity Impact */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            padding: '30px',
                            background: 'rgba(107, 207, 127, 0.1)',
                            borderRadius: '16px',
                            border: '1px solid rgba(107, 207, 127, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(107, 207, 127, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(107, 207, 127, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, #6bcf7f, #8a7fff)',
                                borderRadius: '15px',
                                padding: '20px',
                                fontSize: '24px',
                                minWidth: '70px',
                                height: '70px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'bounce 3s infinite 0.3s'
                            }}>
                                {UIStrings.HOW_IT_WORKS.STEPS.STEP2.EMOJI}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#6bcf7f',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    marginBottom: '12px'
                                }}>
                                    {UIStrings.HOW_IT_WORKS.STEPS.STEP2.TITLE}
                                </div>
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '18px',
                                    lineHeight: '1.6'
                                }} dangerouslySetInnerHTML={renderHTML(UIStrings.HOW_IT_WORKS.STEPS.STEP2.DESCRIPTION)} />
                            </div>
                        </div>

                        {/* Step 3 - Future Support */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            padding: '30px',
                            background: 'rgba(138, 127, 255, 0.1)',
                            borderRadius: '16px',
                            border: '1px solid rgba(138, 127, 255, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(138, 127, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(138, 127, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, #8a7fff, #FF6B6B)',
                                borderRadius: '15px',
                                padding: '20px',
                                fontSize: '24px',
                                minWidth: '70px',
                                height: '70px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'bounce 3s infinite 0.6s'
                            }}>
                                {UIStrings.HOW_IT_WORKS.STEPS.STEP3.EMOJI}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#8a7fff',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    marginBottom: '12px'
                                }}>
                                    {UIStrings.HOW_IT_WORKS.STEPS.STEP3.TITLE}
                                </div>
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '18px',
                                    lineHeight: '1.6'
                                }} dangerouslySetInnerHTML={renderHTML(UIStrings.HOW_IT_WORKS.STEPS.STEP3.DESCRIPTION)} />
                            </div>
                        </div>

                        {/* Step 4 - Mindful Giving */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '30px',
                            padding: '30px',
                            background: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-5px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        >
                            <div style={{
                                background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)',
                                borderRadius: '15px',
                                padding: '20px',
                                fontSize: '24px',
                                minWidth: '70px',
                                height: '70px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: 'bounce 3s infinite 0.9s'
                            }}>
                                {UIStrings.HOW_IT_WORKS.STEPS.STEP4.EMOJI}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    color: '#FF6B6B',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    marginBottom: '12px'
                                }}>
                                    {UIStrings.HOW_IT_WORKS.STEPS.STEP4.TITLE}
                                </div>
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '18px',
                                    lineHeight: '1.6'
                                }} dangerouslySetInnerHTML={renderHTML(UIStrings.HOW_IT_WORKS.STEPS.STEP4.DESCRIPTION)} />
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div style={{
                        padding: '40px 30px',
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(138,127,255,0.2))',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        textAlign: 'center',
                        animation: 'pulse-glow 4s ease-in-out infinite',
                        marginTop: '40px',
                        borderRadius: '16px'
                    }}>
                        <div style={{
                            color: '#FFD93D',
                            fontSize: '28px',
                            fontWeight: 'bold',
                            marginBottom: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '15px'
                        }}>
                            <span style={{ animation: 'spin 3s linear infinite' }}>🚀</span>
                            {UIStrings.HOW_IT_WORKS.CALL_TO_ACTION.TITLE}
                            <span style={{ animation: 'spin 3s linear infinite reverse' }}>🌈</span>
                        </div>
                        <div style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '18px',
                            fontStyle: 'italic',
                            lineHeight: '1.5'
                        }}>
                            {UIStrings.HOW_IT_WORKS.CALL_TO_ACTION.SUBTITLE}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;