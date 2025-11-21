// src/components/DonationBarGraph.jsx
import React, { useState, useEffect } from 'react';
import { DonationsService } from '../lib/donationsService';

export default function DonationBarGraph({ isExpanded, refreshTrigger }) {
  const [donationData, setDonationData] = useState([]);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d, all

  // Fetch donation data for the graph
  useEffect(() => {
    let subscription;

     const fetchGraphData = async () => {
      try {
        console.log('📊 Fetching graph data...');
        const donations = await DonationsService.getAllDonations();
        console.log('📊 Raw donations from DB:', donations);
        
        // Process data based on time range
        const processedData = processDonationData(donations, timeRange);
        console.log('📊 Processed graph data:', processedData);
        setDonationData(processedData);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };

    fetchGraphData();

    // REMOVED: Real-time subscription - we'll refresh via refreshTrigger
  }, [timeRange, refreshTrigger]); 

  // Process donation data for the graph
  const processDonationData = (donations, range) => {
    const now = new Date();
    let filteredDonations = donations;

    // Filter by time range
    if (range === '24h') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredDonations = donations.filter(d => new Date(d.created_at) >= yesterday);
    } else if (range === '7d') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredDonations = donations.filter(d => new Date(d.created_at) >= lastWeek);
    } else if (range === '30d') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredDonations = donations.filter(d => new Date(d.created_at) >= lastMonth);
    }
    // 'all' uses all donations

    // Group by time intervals
    if (range === '24h') {
      // Group by hour for 24h view
      return groupByHours(filteredDonations);
    } else {
      // Group by day for longer ranges
      return groupByDays(filteredDonations, range);
    }
  };

  const groupByHours = (donations) => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(i, 0, 0, 0);
      return {
        label: hour.toLocaleTimeString([], { hour: '2-digit' }),
        total: 0,
        count: 0
      };
    });

    donations.forEach(donation => {
      const hour = new Date(donation.created_at).getHours();
      hours[hour].total += parseFloat(donation.amount);
      hours[hour].count += 1;
    });

    return hours;
  };

  const groupByDays = (donations, range) => {
    const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : Math.min(30, donations.length);
    const days = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        total: 0,
        count: 0,
        date: new Date(date)
      };
    }).reverse();

    donations.forEach(donation => {
      const donationDate = new Date(donation.created_at);
      const dayIndex = days.findIndex(day => 
        day.date.toDateString() === donationDate.toDateString()
      );
      if (dayIndex !== -1) {
        days[dayIndex].total += parseFloat(donation.amount);
        days[dayIndex].count += 1;
      }
    });

    return days;
  };

  // Find max value for scaling
  const maxAmount = Math.max(...donationData.map(item => item.total), 1);

  if (!isExpanded) {
    return (
      <div style={{
        padding: '15px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '12px'
      }}>
        📊
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '10px',
      padding: '15px',
      marginBottom: '15px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
          📈 Donation Activity
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            background: '#0f0e12',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '5px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          <option value="24h" style={{ background: '#0f0e12', color: 'white' }}>24H</option>
          <option value="7d" style={{ background: '#0f0e12', color: 'white' }}>7D</option>
          <option value="30d" style={{ background: '#0f0e12', color: 'white' }}>30D</option>
          <option value="all" style={{ background: '#0f0e12', color: 'white' }}>All</option>
        </select>
      </div>

      {/* Bar Graph */}
      <div style={{
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'space-between',
        height: '120px',
        gap: '4px'
      }}>
        {donationData.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            gap: '4px'
          }}>
            {/* Bar */}
            <div
              style={{
                width: '100%',
                height: `${(item.total / maxAmount) * 80}px`,
                background: item.total > 0 
                  ? 'linear-gradient(to top, #ff6b6b, #ffd93d)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                minHeight: '2px',
                transition: 'all 0.3s ease'
              }}
              title={`$${item.total.toFixed(2)} - ${item.count} donation${item.count !== 1 ? 's' : ''}`}
            />
            
            {/* Label */}
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '9px',
              textAlign: 'center',
              writingMode: donationData.length > 20 ? 'vertical-rl' : 'horizontal-tb',
              transform: donationData.length > 20 ? 'rotate(180deg)' : 'none',
              height: donationData.length > 20 ? '40px' : 'auto'
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <div>
          Total: <strong style={{ color: '#ffd93d' }}>
            ${donationData.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
          </strong>
        </div>
        <div>
          Donations: <strong>{donationData.reduce((sum, item) => sum + item.count, 0)}</strong>
        </div>
      </div>
    </div>
  );
}