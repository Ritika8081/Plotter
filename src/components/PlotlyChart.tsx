// Plotly.js React wrapper for Next.js
import dynamic from 'next/dynamic';
import React from 'react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default Plot;
