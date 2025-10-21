
import React from 'react';

interface ReportSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const ReportSection: React.FC<ReportSectionProps> = ({ icon, title, children }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:border-green-200">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 p-3 rounded-full mr-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-green-800">{title}</h3>
      </div>
      <div className="text-gray-700 space-y-3 prose prose-sm max-w-none">
        {children}
      </div>
    </div>
  );
};

export const InfoItem: React.FC<{ label: string; value: string | string[] }> = ({ label, value }) => (
  <div>
    <p className="font-semibold text-green-700">{label}:</p>
    {Array.isArray(value) ? (
      <ul className="list-disc list-inside pl-4">
        {value.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    ) : (
      <p>{value}</p>
    )}
  </div>
);

export default ReportSection;
