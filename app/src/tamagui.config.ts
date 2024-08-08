// src/tamagui.config.ts
import { createTamagui, createTokens, createFont } from 'tamagui';

// Define tokens with a "true" key in size tokens
const tokens = createTokens({
  color: {
    primary: '#ff0000',
    secondary: '#00ff00',
    lightRed: '#FFCCCC',
    lightBlue: '#CCFFFF',
    red: '#ff0000',
    blue: '#0000ff',
    darkGrey: '#333333',
    grey: '#808080',
  },
  background: {
    red: '#ff0000',
    blue: '#0000ff',
    grey: '#808080',
    darkGrey: '#333333',
    lightRed: '#FFCCCC',
    lightBlue: '#CCFFFF',
  },
  space: {
    small: 8,
    medium: 16,
    large: 32,
    true: 16, // Default space
  },
  size: {
    small: 10,
    medium: 20,
    large: 30,
    true: 20, // Default size
  },
  radius: {
    small: 4,
    medium: 8,
    large: 16,
    true: 8, // Default radius
  },
  zIndex: {
    low: 10,
    medium: 20,
    high: 30,
    true: 10, // Default zIndex
  },
});

// Define themes
const themes = {
  light: {
    background: '#ffffff',
    text: '#000000',
  },
  dark: {
    background: '#000000',
    text: '#ffffff',
  },
  lightRed: {
    background: tokens.color.lightRed,
    color: tokens.color.darkGrey,
  },
  lightBlue: {
    background: tokens.color.lightBlue,
    color: tokens.color.darkGrey,
  },
  red: {
    background: tokens.color.red,
    color: '#fff',
    buttonBackground: tokens.color.red,
    buttonColor: '#fff',
  },
  blue: {
    background: tokens.color.blue,
    color: '#fff',
    buttonBackground: tokens.color.blue,
    buttonColor: '#fff',
  },
  grey: {
    background: tokens.color.grey,
    color: '#fff',
    buttonBackground: tokens.color.grey,
    buttonColor: '#fff',
  },
};

// Define fonts
const fonts = {
  body: createFont({
    family: 'Arial, sans-serif',
    size: {
      small: 12,
      medium: 16,
      large: 20,
      true: 16, // Default font size
    },
    lineHeight: {
      small: 16,
      medium: 20,
      large: 24,
      true: 20, // Default line height
    },
    weight: {
      normal: '400',
      bold: '700',
    },
  }),
  heading: createFont({
    family: 'Georgia, serif',
    size: {
      small: 20,
      medium: 24,
      large: 28,
      true: 24, // Default font size
    },
    lineHeight: {
      small: 24,
      medium: 28,
      large: 32,
      true: 28, // Default line height
    },
    weight: {
      normal: '400',
      bold: '700',
    },
  }),
};

// Define shorthands, if any
const shorthands = {
  bg: 'background',
  fg: 'color',
  p: 'padding',
  m: 'margin',
};

// Create the Tamagui configuration
const tamaguiConfig = createTamagui({
  tokens,
  themes,
  fonts,
  shorthands, // Register shorthands here
});

export default tamaguiConfig;
