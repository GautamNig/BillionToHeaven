// src/components/PayPalDonationButton.jsx
import React from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { UIStrings } from '../config/uiStrings';

function PayPalDonationButton({ amount, onDonationSuccess, disabled }) {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();

    const createOrder = (data, actions) => {
        // Validate amount
        const validAmount = Math.max(1, parseFloat(amount) || 1);

        return actions.order.create({
            purchase_units: [
                {
                    amount: {
                        value: validAmount.toString(),
                        currency_code: UIStrings.PAYMENT.CURRENCY_CODE
                    },
                    description: UIStrings.DONATION.PAYPAL_DESCRIPTION(validAmount)
                }
            ]
        });
    };

    const onApprove = (data, actions) => {
        return actions.order.capture().then((details) => {
            const validAmount = Math.max(1, parseFloat(amount) || 1);
            onDonationSuccess(validAmount, details);
        });
    };

    const onError = (err) => {
        // Error handling without console.log
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