// src/components/PayPalDonationButton.jsx
import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { UIStrings } from '../config/uiStrings';
import useAuth  from '../hooks/useAuth';

function PayPalDonationButton({ amount, onDonationSuccess, disabled }) {
    const { user } = useAuth(); 
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    const isDisabled = disabled || !user || isPending;
     const createOrder = (data, actions) => {
        if (!user) {
            throw new Error('Please sign in to donate');
        }
        
        const validAmount = Math.max(1, parseFloat(amount) || 1);
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: validAmount.toString(),
                    currency_code: UIStrings.PAYMENT.CURRENCY_CODE
                },
                description: UIStrings.DONATION.PAYPAL_DESCRIPTION(validAmount)
            }]
        });
    };

    if (!user) {
        return (
            <div style={{
                position: 'relative',
                width: '100%'
            }}>
                <div style={{
                    width: '100%',
                    height: '40px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '14px',
                    cursor: 'not-allowed'
                }}>
                    🔒 Sign in to donate
                </div>
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    marginTop: '5px',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    pointerEvents: 'none'
                }} className="signin-tooltip">
                    You need to sign in to donate and participate in the bottle message system
                </div>
            </div>
        );
    }


    const onApprove = (data, actions) => {
        return actions.order.capture().then((details) => {
            const validAmount = Math.max(1, parseFloat(amount) || 1);
            onDonationSuccess(validAmount, details);
        });
    };

    const onError = (err) => {
        console.error("PayPal createOrder ERROR:", err);
    };

    if (isRejected) {
        return (
            <div style={{
                color: '#ff6b6b',
                fontSize: '12px',
                textAlign: 'center',
                padding: '10px'
            }}>
                {UIStrings.PAYMENT.PAYPAL_FAILED}
            </div>
        );
    }

    if (isPending) {
        return (
            <div style={{
                color: '#ffd93d',
                fontSize: '12px',
                textAlign: 'center',
                padding: '10px'
            }}>
                {UIStrings.PAYMENT.PAYPAL_LOADING}
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <PayPalButtons
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
                style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'pill',
                    label: 'donate',
                    height: 40
                }}
                disabled={disabled}
            />
        </div>
    );
}

export default PayPalDonationButton;