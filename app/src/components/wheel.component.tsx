import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Wheel as SpinWheel } from './spin-wheel-esm';
import * as easing from './easing.js';
import { loadFonts } from './utils';
import { props as initialProps } from './props';
import './wheel.css';
import axios from 'axios';
import AuthService from "../services/auth.service";

interface User {
  username: string;
}

interface WheelProps {
  onCycleComplete: () => void;
}

interface Entry {
  username: string;
  background_color: string | null;
  amount: number;
}

interface WheelItem {
  label: string;
  backgroundColor?: string;
  weight: number; // Assuming weight is calculated and not directly part of the entry
}

export interface WheelHandle {
  handleTimerEnd: () => void;
}

const Wheel = forwardRef<WheelHandle, WheelProps>(({ onCycleComplete }, ref) => {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [initprops, setProps] = useState(initialProps);
  const wheelWrapperRef = useRef<HTMLDivElement>(null);
  const wheelInstanceRef = useRef(null);
  const [wheelKey, setWheelKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [timerActive, setTimerActive] = useState(true);
  const [cycleActive, setCycleActive] = useState(true);

  useImperativeHandle(ref, () => ({
    handleTimerEnd() {
      console.log('Timer ended. Handling in Wheel.');
      // triggerSpin();
    },
  }), []);

  useEffect(() => {
    const init = async () => {
      await loadFonts(initprops.map(i => i.itemLabelFont));

      // Make sure to clean up the previous wheel instance if it exists
      if (wheelWrapperRef.current && wheelWrapperRef.current.firstChild) {
        wheelWrapperRef.current.removeChild(wheelWrapperRef.current.firstChild);
      }

      const wheel = new SpinWheel(wheelWrapperRef.current);
      wheelInstanceRef.current = wheel as any; // Update the type of wheelInstanceRef to allow assignment of the wheel object.

      // Find the "Money" theme in the props array
      const moneyTheme = initprops.find(p => p.name === 'Money');

      if (moneyTheme) {
        // Initialize the wheel with the "Money" theme
        wheel.init({
          ...moneyTheme,
          rotation: wheel.rotation, // Preserve value.
        });
      }

      // Save object globally for easy debugging.
      (window as any).myWheel = wheel;
    };

    init();
  }, [initprops, wheelKey]);

  useEffect(() => {
    // Start the initial cycle immediately
    triggerCycle();
  }, []);

  useEffect(() => {
    // Retrieve the logged-in user's information when the component mounts
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const triggerCycle = () => {
    // Begin with fetching phase
    let fetchTimeouts: number[] = []; // Explicitly type as number[] for browser environments
    for (let i = 0; i < 30; i++) { // 30 fetches, every 2 seconds for 60 seconds
      fetchTimeouts.push(window.setTimeout(() => fetchEntries(), i * 10000));
    }
  
    // After 60 seconds, pause fetching and trigger spin
    setTimeout(() => {
      // Clear any pending fetch timeouts to ensure no fetch happens during the spin
      fetchTimeouts.forEach(timeout => clearTimeout(timeout));
  
      // Trigger the spin
      triggerSpin().then(() => {
        // After the spin (assuming 15 seconds for animation), restart the cycle
        setTimeout(triggerCycle, 15000);
      });
    }, 60000);
  };

  const fetchEntries = async () => {
    if (!cycleActive) return; // Skip fetching if cycle is not active
    try {
      const response = await axios.get('http://localhost:8080/api/jackpot/getEntries');
    const fetchedItems = response.data.map((entry: Entry) => ({
      label: entry.username,
      labelColor: '#fff', // Default to '#fff' if labelColor is null
      backgroundColor: entry.background_color || '#808080', // Default to '#000' if background_color is null
      weight: entry.amount, // Temporarily store amount here; will calculate weight next
    }));
    console.log("Fetched items: ", fetchedItems); // Debugging

    // Calculate the total amount
    const totalAmount = fetchedItems.reduce((acc: number, item: WheelItem) => acc + item.weight, 0);

    // Assign the correct weight based on totalAmount
    const itemsWithWeight = fetchedItems.map((item: WheelItem) => ({
      ...item,
      weight: item.weight / totalAmount,
    }));

    // Find the "Money" theme index in the props array to update it
    const index = initprops.findIndex(p => p.name === 'Money');
    if (index !== -1) {
      const newProps = [...initprops];
      newProps[index] = { ...newProps[index], items: itemsWithWeight };
      setProps(newProps);
    }
    } catch (error) {
      console.error("Error fetching entries: ", error);
    }
};

  const animateWheelToPosition = (winningPosition: number) => {
    const rotations = 2; // Spin the wheel 5 times for visual effect
    const totalRotation = (rotations * 360) + winningPosition; // Ensure the wheel spins 5 times then lands on the winning position
    console.log("Animating wheel to position: ", totalRotation);
    (wheelInstanceRef.current as any).spinTo(-totalRotation, 4000, null); // Adjust based on your wheel's API
  };

  const triggerSpin = async () => {
    setCycleActive(false); // Pause the cycle for spin
    console.log("Attempting to trigger spin");
    try {
      const response = await axios.post('http://localhost:8080/api/jackpot/spin');
      const { winner, position } = response.data;
      console.log(`Winner: ${winner}, Position: ${position}`);
      animateWheelToPosition(position); // Make sure this function correctly interprets the position
      setTimeout(() => {
        setCycleActive(true); // Resume the cycle after spin animation
        console.log("Spin animation completed, resuming cycle.");
        onCycleComplete(); // Call the callback here
      }, 15000);
    } catch (error) {
      console.error("Error triggering the spin: ", error);
      // Even in case of an error, resume the cycle after a delay to keep the process going
      setTimeout(() => {
        setCycleActive(true); // Resume the cycle after spin animation
        console.log("Spin animation completed, resuming cycle.");
        onCycleComplete(); // Call the callback here
      }, 15000);
    }
  };

  const addSlice = async () => {
    // Assuming `currentUser` holds the username of the logged-in user
    const username = currentUser?.username; // Replace this with actual logic to get the current user's username
    const newAmount = Number(amount);
    if (!username || newAmount <= 0) {
      console.error("Invalid user or amount");
      return;
    }
    try {
      await axios.post('http://localhost:8080/api/jackpot/addEntry', {
        username: username,
        amount: newAmount,
        // wallet_id and transaction_id can be omitted or set to null explicitly if your backend handles it
      });
      console.log("Entry added successfully");
    } catch (error) {
      console.error("Error adding entry: ", error);
    }
  
    // Clear inputs after sending data
    setLabel('');
    setAmount('');
  };

  return (
    <div>
    <div className="container">
      <div className="ticker"></div> {/* Add this line for the ticker */}
      <h3></h3>
      <div key={wheelKey} className="wheel-wrapper" ref={wheelWrapperRef} style={{ height: '300px', width: '500px' }}>
      </div>
      <button onClick={triggerSpin}>Spin</button>
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" />
      <button onClick={addSlice}>Enter</button>
    </div>
  </div>
  );
});

export default Wheel;