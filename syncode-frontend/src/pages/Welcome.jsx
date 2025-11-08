import React, { useEffect } from "react";
import "./Welcome.css";

const Welcome = ({ onNext }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext(); // trigger transition to Login
    }, 3500); // 3.5 seconds delay

    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="welcome-container fade-out-on-exit">
      <h1>Syncode</h1>
      <p>Code. Share. Shine.</p>
      <button onClick={onNext}>Start Coding</button>
    </div>
  );
};

export default Welcome;
