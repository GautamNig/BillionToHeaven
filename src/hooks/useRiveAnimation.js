// src/hooks/useRiveAnimation.js
import { useState, useEffect, useRef } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { UIStrings } from '../config/uiStrings';

export default function useRiveAnimation() {
    const [isClimbing, setIsClimbing] = useState(false);
    const [currentDonation, setCurrentDonation] = useState(0);
    const [debugInfo, setDebugInfo] = useState('');
    const [riveLoaded, setRiveLoaded] = useState(false);
    const directionInputRef = useRef();

    const { RiveComponent, rive } = useRive({
        src: `${import.meta.env.BASE_URL}rive/8866-17054-stairs-marcelo-bazani.riv`,
        autoplay: true,
        stateMachines: ["State Machine 1"],
        onLoad: () => {
            setRiveLoaded(true);
        },
        onLoadError: (error) => {
            setRiveLoaded(true);
        },
    });

    // Initialize Rive input
    useEffect(() => {
        if (rive) {
            if (rive.stateMachineInputs) {
                const inputs = rive.stateMachineInputs("State Machine 1");
                if (inputs && inputs.length > 0) {
                    directionInputRef.current = inputs[0];
                    setDebugInfo(UIStrings.DEBUG.DIRECTION_INPUT_FOUND);
                }
            }
        }
    }, [rive]);

    const startClimbingAnimation = (amount) => {
        if (!directionInputRef.current) {
            setDebugInfo(UIStrings.DEBUG.NO_DIRECTION_INPUT);
            return 0;
        }

        setIsClimbing(true);
        setCurrentDonation(amount);

        const duration = (amount * 3) / 5; // 0.6 seconds per dollar

        try {
            directionInputRef.current.value = 1;
            setDebugInfo(UIStrings.DEBUG.CLIMBING_ANIMATION(amount, duration));

            setTimeout(() => {
                directionInputRef.current.value = 0;
                setIsClimbing(false);
                setCurrentDonation(0);
                setDebugInfo(UIStrings.DEBUG.ANIMATION_COMPLETED);
            }, duration * 1000);

            return duration;
        } catch (error) {
            setDebugInfo(`${UIStrings.DEBUG.ANIMATION_ERROR} ${error.message}`);
            setIsClimbing(false);
            return 0;
        }
    };

    return {
        RiveComponent,
        rive,
        isClimbing,
        currentDonation,
        debugInfo,
        riveLoaded,
        startClimbingAnimation,
        directionInputRef
    };
}