import React, { MouseEvent } from 'react';
import './NavButton.css';

type NavButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

const NavButton: React.FC<NavButtonProps> = ({ label, active, onClick }) => {
  const handleMouseOver = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "#66B3FF";
  };

  const handleMouseOut = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = active ? "#4285F4" : "#f0f0f0";
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    // Set ripple dimensions
    ripple.style.width = ripple.style.height = `${diameter}px`;
    
    // Calculate the click position within the button
    const rect = button.getBoundingClientRect();
    const rippleX = e.clientX - rect.left - radius;
    const rippleY = e.clientY - rect.top - radius;

    ripple.style.left = `${rippleX}px`;
    ripple.style.top = `${rippleY}px`;
    ripple.className = "ripple";

    // Append ripple to the button and remove it after animation
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700); // Match this time with the ripple animation duration

    // Trigger the provided onClick handler
    onClick();
  };

  return (
    <button
      className={`nav-button ${active ? 'active' : ''}`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleClick}
    >
      {label}
    </button>
  );
};

export default NavButton;
