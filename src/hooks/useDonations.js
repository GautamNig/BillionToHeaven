// src/hooks/useDonations.js
import { useState, useEffect, useCallback } from 'react';
import { DonationsService } from '../lib/donationsService';
import { UIStrings } from '../config/uiStrings';

export default function useDonations(user) {
    const [totalMoney, setTotalMoney] = useState(0);
    const [currentGoal, setCurrentGoal] = useState(1000000000);
    const [donationHistory, setDonationHistory] = useState([]);
    const [allDonations, setAllDonations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [graphRefreshTrigger, setGraphRefreshTrigger] = useState(0);

    // Initialize donation data
    useEffect(() => {
        const initializeData = async () => {
            try {
                setIsLoading(true);

                const [total, goal, recent, allDonationsData] = await Promise.all([
                    DonationsService.getTotalAmount(),
                    DonationsService.getCurrentGoal(),
                    DonationsService.getRecentDonations(5),
                    DonationsService.getAllDonations()
                ]);

                setTotalMoney(total);
                setCurrentGoal(parseFloat(goal.target_amount));
                setDonationHistory(recent);
                setAllDonations(allDonationsData);

            } catch (error) {
                // Error handling without console.log
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, []);

    const handleRealTimeUpdate = useCallback(async (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
            const donation = payload.new;

            // Update stats and graph
            try {
                const newTotal = await DonationsService.getTotalAmount();
                setTotalMoney(newTotal);

                const newRecent = await DonationsService.getRecentDonations(5);
                setDonationHistory(newRecent);

                const newAllDonations = await DonationsService.getAllDonations();
                setAllDonations(newAllDonations);

                setGraphRefreshTrigger(prev => prev + 1);
            } catch (error) {
                // Error handling without console.log
            }

            return donation;
        }
    }, [user]);

    const refreshDonationData = useCallback(async () => {
        try {
            const [newTotal, newRecent, newAllDonations] = await Promise.all([
                DonationsService.getTotalAmount(),
                DonationsService.getRecentDonations(5),
                DonationsService.getAllDonations()
            ]);

            setTotalMoney(newTotal);
            setDonationHistory(newRecent);
            setAllDonations(newAllDonations);
            setGraphRefreshTrigger(prev => prev + 1);
        } catch (error) {
            // Error handling without console.log
        }
    }, []);

    const addDonation = useCallback(async (amount, paypalDetails) => {
        try {
            // Save donation to database
            const donationRecord = await DonationsService.addDonation(
                amount,
                user?.id,
                user?.email
            );

            // Refresh all data
            await refreshDonationData();

            return donationRecord;
        } catch (error) {
            throw error;
        }
    }, [user, refreshDonationData]);

    return {
        totalMoney,
        currentGoal,
        donationHistory,
        allDonations,
        isLoading,
        graphRefreshTrigger,
        handleRealTimeUpdate,
        addDonation,
        refreshDonationData
    };
}