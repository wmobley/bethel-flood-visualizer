import React from 'react';

const Popup = ({ feature, currentVisualization, visualizationType, logRanges, formatNumber }) => {
  const props = feature.properties;
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '16px', 
        fontWeight: 'bold', 
        color: '#1f2937' 
      }}>
        Location ID: {props.cmb_id}
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ 
          margin: '0 0 6px 0', 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#374151' 
        }}>
          {currentVisualization.label}
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4px', 
          fontSize: '12px' 
        }}>
          <span>
            <strong>{currentVisualization.label.split(' ')[0]}:</strong> {formatNumber(props[currentVisualization.valueField])}
          </span>
          <span>
            <strong>Rank:</strong> {formatNumber(props[currentVisualization.rankField])}
          </span>
        </div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ 
          margin: '0 0 6px 0', 
          fontSize: '14px', 
          fontWeight: 'bold', 
          color: '#374151' 
        }}>
          All Metrics
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4px', 
          fontSize: '12px' 
        }}>
          <span><strong>Risk:</strong> {formatNumber(props.risk)}</span>
          <span><strong>Rank:</strong> {formatNumber(props.rank_risk)}</span>
          <span><strong>Hazard:</strong> {formatNumber(props.hazard)}</span>
          <span><strong>Rank:</strong> {formatNumber(props.rank_haz)}</span>
          <span><strong>Exposure:</strong> {formatNumber(props.exposure)}</span>
          <span><strong>Rank:</strong> {formatNumber(props.rank_exposure)}</span>
          <span><strong>Vulnerability:</strong> {formatNumber(props.vulnerability)}</span>
          <span><strong>Rank:</strong> {formatNumber(props.rank_vulnerability)}</span>
        </div>
      </div>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#6b7280', 
        borderTop: '1px solid #e5e7eb', 
        paddingTop: '6px' 
      }}>
        <em>
          Higher numbers indicate higher {visualizationType} (Logarithmic scale: Min: {formatNumber(logRanges.min)}, Max: {formatNumber(logRanges.max)})
        </em>
      </div>
    </div>
  );
};

export default Popup;