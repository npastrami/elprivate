import React, { FC, FormEvent } from 'react';

interface FormWrapperProps {
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

const FormWrapper: FC<FormWrapperProps> = ({ children, onSubmit }) => (
  <form onSubmit={onSubmit}>
    {children}
  </form>
);

export default FormWrapper;
