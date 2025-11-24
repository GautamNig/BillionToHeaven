// src/components/HeavenDoor.jsx
import React, { useState } from 'react';
import { UIStrings } from '../config/uiStrings';

// Configuration objects
const DOOR_CONFIG = {
    tilt: {
        perspective: 1000,
        rotateY: -35,
        rotateX: 0,
        scale: 1.0
    },
    glow: {
        innerGlow: { color: 'rgba(255, 215, 0, 0.6)', blur: 25, spread: 0 },
        middleGlow: { color: 'rgba(255, 215, 0, 0.4)', blur: 50, spread: 0 },
        outerGlow: { color: 'rgba(255, 215, 0, 0.2)', blur: 100, spread: 0 },
        insetGlow: { color: 'rgba(255, 215, 0, 0)', blur: 0, spread: 0 }
    },
    border: { width: 0, color: 'transparent', radius: 10 },
    hover: { rotateY: -10, rotateX: 3, scale: 1.02, glowBoost: 1.5 },
    backgroundGlow: { intensity: 0.9, size: '120%', borderRadius: 15 },
    filters: { brightness: 1.1, contrast: 1.1, saturate: 1.2 }
};

const HeavenDoor = () => {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Door styling helpers
    const getTransform = (config) => {
        return `perspective(${config.perspective}px) rotateY(${config.rotateY}deg) rotateX(${config.rotateX}deg) scale(${config.scale})`;
    };

    const getGlowShadow = (glowConfig, hoverMultiplier = 1) => {
        const inner = glowConfig.innerGlow;
        const middle = glowConfig.middleGlow;
        const outer = glowConfig.outerGlow;
        const inset = glowConfig.insetGlow;

        return `
            0 0 ${inner.blur * hoverMultiplier}px ${inner.spread}px ${inner.color},
            0 0 ${middle.blur * hoverMultiplier}px ${middle.spread}px ${middle.color},
            0 0 ${outer.blur * hoverMultiplier}px ${outer.spread}px ${outer.color},
            inset 0 0 ${inset.blur * hoverMultiplier}px ${inset.spread}px ${inset.color}
        `;
    };

    const getFilters = () => {
        return `brightness(${DOOR_CONFIG.filters.brightness}) contrast(${DOOR_CONFIG.filters.contrast}) saturate(${DOOR_CONFIG.filters.saturate})`;
    };

    return (
        <div style={{
            width: '65%',
            height: '120%',
            minWidth: '400px',
            position: 'relative',
            background: '#2b0c5c',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Enhanced Glow Container */}
            <div style={{
                position: 'relative',
                width: DOOR_CONFIG.backgroundGlow.size,
                height: DOOR_CONFIG.backgroundGlow.size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `radial-gradient(ellipse at center, 
                    rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity}) 0%, 
                    rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity * 0.5}) 50%, 
                    transparent 80%)`,
                borderRadius: `${DOOR_CONFIG.backgroundGlow.borderRadius}px`,
                padding: '0px'
            }}>
                {/* Main Door Image - No Border, Just Glow */}
                <img
                    src={`${import.meta.env.BASE_URL}assets/door-stretching-into-fantasy-world.jpg`}
                    alt={UIStrings.DOOR.ALT_TEXT}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => { }}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        transform: getTransform(DOOR_CONFIG.tilt),
                        borderRadius: `${DOOR_CONFIG.border.radius}px`,
                        border: 'none',
                        boxShadow: getGlowShadow(DOOR_CONFIG.glow),
                        filter: getFilters(),
                        transition: 'all 0.5s ease'
                    }}
                    onMouseEnter={(e) => {
                        const hoverTransform = getTransform({
                            ...DOOR_CONFIG.tilt,
                            rotateY: DOOR_CONFIG.hover.rotateY,
                            rotateX: DOOR_CONFIG.hover.rotateX,
                            scale: DOOR_CONFIG.hover.scale
                        });
                        e.target.style.transform = hoverTransform;
                        e.target.style.boxShadow = getGlowShadow(DOOR_CONFIG.glow, DOOR_CONFIG.hover.glowBoost);
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = getTransform(DOOR_CONFIG.tilt);
                        e.target.style.boxShadow = getGlowShadow(DOOR_CONFIG.glow);
                    }}
                />

                {/* Enhanced Glow Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '-20px',
                    right: '-20px',
                    bottom: '-20px',
                    background: `radial-gradient(ellipse at center, 
                        transparent 20%, 
                        rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity * 0.3}) 60%, 
                        rgba(255,215,0,${DOOR_CONFIG.backgroundGlow.intensity * 0.1}) 100%)`,
                    borderRadius: `${DOOR_CONFIG.backgroundGlow.borderRadius + 10}px`,
                    pointerEvents: 'none',
                    animation: 'pulse-glow 4s ease-in-out infinite'
                }} />

                {/* Floating Golden Particles */}
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '-10px',
                    right: '-10px',
                    bottom: '-10px',
                    background: `
                        radial-gradient(3px 3px at 10% 20%, rgba(255,215,0,0.9), transparent),
                        radial-gradient(3px 3px at 30% 80%, rgba(255,215,0,0.7), transparent),
                        radial-gradient(2px 2px at 50% 10%, rgba(255,215,0,0.8), transparent),
                        radial-gradient(2px 2px at 70% 60%, rgba(255,215,0,0.6), transparent),
                        radial-gradient(3px 3px at 90% 30%, rgba(255,215,0,0.9), transparent),
                        radial-gradient(2px 2px at 20% 70%, rgba(255,215,0,0.7), transparent)
                    `,
                    borderRadius: `${DOOR_CONFIG.backgroundGlow.borderRadius + 5}px`,
                    pointerEvents: 'none',
                    animation: 'float 8s ease-in-out infinite'
                }} />
            </div>

            {/* Gradient Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50px',
                height: '100%',
                background: 'linear-gradient(90deg, #2b0c5c, transparent)',
                pointerEvents: 'none'
            }} />

            {/* Loading State for Door Image */}
            {!imageLoaded && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(45deg, #2b0c5c, #4a1b9d)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffd93d',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}>
                    {UIStrings.DOOR.LOADING_TEXT}
                </div>
            )}
        </div>
    );
};

export default HeavenDoor;