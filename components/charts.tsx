import React from 'react';
import type { CropMarketData } from '../types';

// Let TypeScript know Recharts might be on the window object
declare global {
  interface Window {
    Recharts: any;
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-gray-300 rounded shadow-lg">
                <p className="font-bold text-gray-800">{label}</p>
                <p style={{ color: payload[0].fill }}>{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

interface GenericChartProps {
    data: any[];
    nameKey: string;
    valueKey: string;
    chartTitle: string;
    barName: string;
    barColor: string;
}

const GenericBarChart: React.FC<GenericChartProps> = ({ data, nameKey, valueKey, chartTitle, barName, barColor }) => {
    if (typeof window.Recharts === 'undefined') {
        return <div style={{height: 300}} className="flex items-center justify-center text-gray-500">Loading Chart...</div>;
    }
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    const chartData = data.map(item => ({
        name: item[nameKey],
        value: item[valueKey],
    }));

    return (
        <div style={{ width: '100%', height: 300 }} className="mt-8">
            <h4 className="text-lg font-bold text-green-800 text-center mb-2">{chartTitle}</h4>
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name={barName} fill={barColor} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const YieldChart: React.FC<Omit<GenericChartProps, 'barName' | 'barColor' | 'chartTitle'>> = (props) => (
    <GenericBarChart {...props} chartTitle="Potential Yield" barName="Yield" barColor="#34D399" />
);

export const PriceChart: React.FC<Omit<GenericChartProps, 'barName' | 'barColor' | 'chartTitle'>> = (props) => (
    <GenericBarChart {...props} chartTitle="Average Market Price" barName="Price (₹)" barColor="#3B82F6" />
);


export const MarketPriceChart: React.FC<{ data: CropMarketData[] }> = ({ data }) => {
    if (typeof window.Recharts === 'undefined') {
        return <div style={{height: 300}} className="flex items-center justify-center text-gray-500 mt-4">Loading Chart...</div>;
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div style={{height: 300}} className="flex items-center justify-center text-gray-500 mt-4">No price data to display.</div>
    }
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = window.Recharts;

    const chartData = data.map(crop => ({
        name: crop.cropName,
        'Price per kg (₹)': crop.pricePerKgValue,
    }));

    return (
        <div style={{ width: '100%', height: 300 }} className="mt-4">
            <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Price per kg (₹)" fill="#8B5CF6" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};