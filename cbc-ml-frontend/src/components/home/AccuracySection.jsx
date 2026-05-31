import React from 'react'

import  './AccuracySection.css'

const AccuracySection = ({onTryNow }) => {
    return (
        <section className="accuracy-section">
          <div className="accuracy-corner accuracy-corner-tr" />
          <div className="accuracy-corner accuracy-corner-br" />
    
          <div className="accuracy-inner">
            <div className="accuracy-copy">
              <p className="accuracy-eyebrow">WHAT WE ARE DOING</p>
    
              <h2>
                An Almost-perfectly
                <br />
                Accurate Method
              </h2>
    
              <p className="accuracy-description">
                Cellens is pioneering in blood-free cell analysis with a
                combination of high-resolution nanoscale imaging and proprietary
                machine learning. Our novel application of quantitative cell's
                physical properties analysis in cancer detection reveals new
                clinically meaningful information that is translated into
                high-performing diagnostic tools.
              </p>
    
              <div className="accuracy-buttons">
                <button className="accuracy-primary-btn">
                  Learn How <span>→</span>
                </button>
    
                <button onClick={onTryNow} className="accuracy-link-btn">
                  Application <span>→</span>
                </button>
              </div>
            </div>
    
            <div className="accuracy-stats">
              <div className="accuracy-stat">
                <h3>98%</h3>
                <p>Detection Accuracy</p>
              </div>
    
              <div className="accuracy-stat">
                <h3>50%</h3>
                <p>
                  More cost effective
                  <br />
                  comparing to other methods
                </p>
              </div>
            </div>
          </div>
        </section>
      );
}

export default AccuracySection
