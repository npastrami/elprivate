import React, { Component } from "react";
import AuthService from "../services/auth.service";
import { Stack, Input, Label, Text, YStack, TamaguiProvider } from 'tamagui';
import { CustomButton } from "../components/CustomButton";
import tamaguiConfig from '../tamagui.config';

type State = {
  email: string,
  message: string,
  loading: boolean,
  successful: boolean,
  emailError: string,
};

export default class ForgotPassword extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.handleForgotPassword = this.handleForgotPassword.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      email: "",
      message: "",
      loading: false,
      successful: false,
      emailError: "",
    };
  }

  handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { email } = this.state;

    if (!email) {
      this.setState({ emailError: "Please enter your email address." });
      return;
    }

    this.setState({
      message: "",
      loading: true,
      emailError: "",
    });

    AuthService.forgotPassword(email).then(
      response => {
        this.setState({
          message: response.data.message,
          successful: true,
          loading: false
        });
      },
      error => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        this.setState({
          successful: false,
          loading: false,
          message: resMessage
        });
      }
    );
  }

  handleChange(e: any) {
    const value = e.nativeEvent.text;
    this.setState({ email: value });
  }

  render() {
    const { email, message, loading, emailError, successful } = this.state;

    return (
      <TamaguiProvider config={tamaguiConfig}>
        <YStack alignItems="center" justifyContent="center" height="90vh" backgroundColor="$backgroundStrong">
          <Stack backgroundColor="$darkGrey" padding="$6" borderRadius={20} width={500} height={400} alignItems="center" marginBottom="135px" justifyContent="center">
            <form onSubmit={this.handleForgotPassword}>
              {!successful && (
                <YStack gap="$4" width="100%" paddingHorizontal="$4">
                  <Label htmlFor="email"></Label>
                  <Input
                    placeholder="Email Address"
                    size="$4"
                    value={email}
                    onChange={this.handleChange}
                    style={{ marginTop: 12 }}
                  />
                  {emailError ? (<Text color="red">{emailError}</Text>) : null}

                  <CustomButton theme="red" disabled={loading} style={{ marginTop: 24 }}>
                    {loading ? (
                      <Text>Sending...</Text>
                    ) : (
                      <Text color="black">Send Reset Link</Text>
                    )}
                  </CustomButton>
                </YStack>
              )}
              {message && <Text color="red" style={{ marginTop: 16 }}>{message}</Text>}
            </form>
          </Stack>
        </YStack>
      </TamaguiProvider>
    );
  }
}
