import React from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

const VendorRadarChart = ({ vendor }) => {
  const data = [
    { subject: 'Cost', value: vendor.cost_score ?? 70 },
    { subject: 'Delivery', value: vendor.delivery_score ?? 70 },
    { subject: 'Compliance', value: vendor.compliance_score ?? 70 },
    { subject: 'Security', value: vendor.security_score ?? 70 },
    { subject: 'Experience', value: vendor.experience_score ?? 70 },
  ];

  return (
    <div className="radar-chart-wrapper">
      <h4 className="radar-title">Performance Radar</h4>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={vendor.company_name}
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '13px'
            }}
            formatter={(value) => [`${value}/100`, '']}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="radar-scores-row">
        {data.map((item) => (
          <div key={item.subject} className="radar-score-chip">
            <span className="radar-score-label">{item.subject}</span>
            <span className="radar-score-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorRadarChart;
