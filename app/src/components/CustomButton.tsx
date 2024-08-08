// components/CustomButton.tsx
import { styled, Button, Text } from 'tamagui';
import { withStaticProperties } from '@tamagui/core';

const CustomButtonFrame = styled(Button, {
  name: 'CustomButton',
  backgroundColor: '',
  color: '$white',
  paddingHorizontal: '$sm',
  borderRadius: '$md',
  cursor: 'not-allowed',
  hoverStyle: {
    backgroundColor: '',
  },
  pressStyle: {
    backgroundColor: '',
  },
  variants: {
    enabled: {
      true: {
        backgroundColor: '$red',
        cursor: 'pointer',
        hoverStyle: {
          backgroundColor: '$blue',
        },
        pressStyle: {
          backgroundColor: '$blue',
        },
      },
    },
  },
  defaultVariants: {
    enabled: false,
  },
});

const CustomButtonText = styled(Text, {
  color: '$white',
  textAlign: 'center',
  padding: '$2',
});

export const CustomButton = withStaticProperties(CustomButtonFrame, {
  Text: CustomButtonText,
});
