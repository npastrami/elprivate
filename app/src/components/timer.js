import React, { useState, useEffect } from 'react';
import "./timer.css";

const Timer = ({ onTimerEnd }) => {
  const totalTime = 1 * 60; // Adjusted for 10 minutes
  const [secondsLeft, setSecondsLeft] = useState(totalTime);

  useEffect(() => {
    let timer;
    if (secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft(secondsLeft - 1);
      }, 1000);
    } else {
      onTimerEnd(); // Call the passed callback function when the timer ends
    }

    return () => clearInterval(timer);
  }, [secondsLeft, onTimerEnd]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="timer">
      <div className="tt_container">
        <div className="timer_container">
          <h3>10 Min BTC Jackpot</h3>
          <p>{minutes < 10 ? "0" + minutes : minutes} : {seconds < 10 ? "0" + seconds : seconds}</p>
        </div>
      </div>
    </div>
  );
};

export default Timer;