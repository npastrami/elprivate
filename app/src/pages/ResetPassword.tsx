import React, { Component } from "react";
import AuthService from "../services/auth.service";
import { Stack, Input, Label, Text, YStack, TamaguiProvider } from 'tamagui';
import { CustomButton } from "../components/CustomButton";
import tamaguiConfig from '../tamagui.config';
import { Navigate } from "react-router-dom";

type State = {
  newPassword: string,
  confirmPassword: string,
  message: string,
  loading: boolean,
  successful: boolean,
  newPasswordError: string,
  confirmPasswordError: string,
  redirect: boolean
};

export default class ResetPassword extends Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.handleResetPassword = this.handleResetPassword.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      newPassword: "",
      confirmPassword: "",
      message: "",
      loading: false,
      successful: false,
      newPasswordError: "",
      confirmPasswordError: "",
      redirect: false
    };
  }

  handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { newPassword, confirmPassword } = this.state;

    if (newPassword !== confirmPassword) {
      this.setState({ confirmPasswordError: "Passwords do not match." });
      return;
    }

    if (!newPassword) {
      this.setState({ newPasswordError: "Please enter a new password." });
      return;
    }

    this.setState({
      message: "",
      loading: true,
      newPasswordError: "",
      confirmPasswordError: "",
    });

    // Assuming the reset token is passed as a query parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    AuthService.resetPassword(token, newPassword).then(
      (response: any) => {
        this.setState({
          message: response.data.message,
          successful: true,
          loading: false,
          redirect: true
        });
      },
      (error: any) => {
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

  handleChange(field: string, value: string) {
    this.setState({ [field]: value } as unknown as Pick<State, keyof State>);
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to="/login" />;
    }

    const { newPassword, confirmPassword, message, loading, newPasswordError, confirmPasswordError, successful } = this.state;

    return (
      <TamaguiProvider config={tamaguiConfig}>
        <YStack alignItems="center" justifyContent="center" height="90vh" backgroundColor="$backgroundStrong">
          <Stack backgroundColor="$darkGrey" padding="$6" borderRadius={20} width={500} height={500} alignItems="center" marginBottom="135px" justifyContent="center">
            <form onSubmit={this.handleResetPassword}>
              {!successful && (
                <YStack gap="$4" width="100%" paddingHorizontal="$4">
                  <Label htmlFor="newPassword"></Label>
                  <Input
                    placeholder="New Password"
                    size="$4"
                    value={newPassword}
                    onChangeText={(text) => this.handleChange("newPassword", text)}
                    style={{ marginTop: 12 }}
                  />
                  {newPasswordError ? (<Text color="red">{newPasswordError}</Text>) : null}

                  <Label htmlFor="confirmPassword"></Label>
                  <Input
                    placeholder="Confirm New Password"
                    size="$4"
                    value={confirmPassword}
                    onChangeText={(text) => this.handleChange("confirmPassword", text)}
                    style={{ marginTop: 12 }}
                  />
                  {confirmPasswordError ? (<Text color="red">{confirmPasswordError}</Text>) : null}

                  <CustomButton theme="red" disabled={loading} style={{ marginTop: 24 }}>
                    {loading ? (
                      <Text>Resetting...</Text>
                    ) : (
                      <Text color="black">Reset Password</Text>
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
