// src/components/AnimationAttribution.jsx
import React from 'react';
import { UIStrings } from '../config/uiStrings';

const AnimationAttribution = () => {
    return (
        <div style={{
            position: 'fixed',
            bottom: '2px',
            left: '2px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '9px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 1000,
            maxWidth: '200px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span>🎨</span>
                <span style={{ fontWeight: 'bold', color: '#FFD93D' }}>{UIStrings.ATTRIBUTION.ANIMATION}</span>
            </div>
            <div style={{ lineHeight: '1.3' }}>
                "{UIStrings.ATTRIBUTION.BY}" <strong>{UIStrings.ATTRIBUTION.CREATOR}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <a
                        href={UIStrings.ATTRIBUTION.LICENSE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#FFD93D',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                        }}
                    >
                        <span>{UIStrings.ATTRIBUTION.LICENSE}</span>
                    </a>
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                    <a
                        href={UIStrings.ATTRIBUTION.RIVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#FFD93D',
                            textDecoration: 'none'
                        }}
                    >
                        {UIStrings.ATTRIBUTION.VIEW_ON_RIVE}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AnimationAttribution;