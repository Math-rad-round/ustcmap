import React from 'react';

const Ans = ({ text }) => {
  return (
    <div className="ans-container">
      <div className="ans-content">
        {text}
      </div>
    </div>
  );
};

export default Ans;