import React, { Component } from "react";
import AuthService from "../services/auth.service";
import { Stack, Input, Label, Text, YStack, Image, TamaguiProvider } from 'tamagui';
import { CustomButton } from "../components/CustomButton";
import tamaguiConfig from '../tamagui.config';

type Props = {};

type State = {
  username: string,
  email: string,
  password: string,
  successful: boolean,
  message: string,
  loading: boolean,
  isUsernameValid: boolean,
  isEmailValid: boolean,
  isPasswordValid: boolean,
  usernameError: string,
  emailError: string,
  passwordError: string,
};

export default class Register extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.handleRegister = this.handleRegister.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    this.state = {
      username: "",
      email: "",
      password: "",
      successful: false,
      message: "",
      loading: false,
      isUsernameValid: false,
      isEmailValid: false,
      isPasswordValid: false,
      usernameError: "",
      emailError: "",
      passwordError: "",
    };
  }

  validateFields(name: string, value: string) {
    let isValid = false;
    let error = "";
    switch (name) {
      case "username":
        isValid = value.length >= 3 && value.length <= 20;
        error = isValid ? "" : "The username must be 3-20 characters.";
        this.setState({ isUsernameValid: isValid, usernameError: error });
        break;
      case "email":
        isValid = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);
        error = isValid ? "" : "This is not a valid email.";
        this.setState({ isEmailValid: isValid, emailError: error });
        break;
      case "password":
        isValid = value.length >= 6 && value.length <= 40;
        error = isValid ? "" : "The password must be 6 or more characters.";
        this.setState({ isPasswordValid: isValid, passwordError: error });
        break;
      default:
        break;
    }
    return isValid;
  }

  handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { username, email, password } = this.state;

    const isUsernameValid = this.validateFields("username", username);
    const isEmailValid = this.validateFields("email", email);
    const isPasswordValid = this.validateFields("password", password);

    if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
      this.setState({ message: "Please fill out all fields correctly.", successful: false });
      return;
    }

    this.setState({
      message: "",
      successful: false,
      loading: true
    });

    AuthService.register(username, email, password).then(
      response => {
        this.setState({
          message: response.data.message,
          successful: true,
          loading: false
        });
      },
      error => {
        let resMessage = "An error occurred.";
        try {
          resMessage =
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString();
        } catch (e) {
          resMessage = error.toString();
        }

        this.setState({
          successful: false,
          message: resMessage,
          loading: false
        });
      }
    );
  }

  handleChange(name: string, value: string) {
    this.setState((prevState) => ({
      ...prevState,
      [name]: value,
    }), () => {
      this.validateFields(name, value);
    });
  }

  handleBlur(name: string, value: string) {
    this.validateFields(name, value);
  }

  render() {
    const { successful, message, loading, username, email, password, isUsernameValid, isEmailValid, isPasswordValid, usernameError, emailError, passwordError } = this.state;
    const isFormValid = isUsernameValid && isEmailValid && isPasswordValid;

    return (
      <TamaguiProvider config={tamaguiConfig}>
        <YStack alignItems="center" justifyContent="center" height="90vh" backgroundColor="$backgroundStrong">
          <Stack backgroundColor="$darkGrey" padding="$6" borderRadius={20} width={500} height={598} alignItems="center" marginBottom="135px" justifyContent="center">
            <Image
              src="//ssl.gstatic.com/accounts/ui/avatar_2x.png"
              alt="profile-img"
              width={80}
              height={80}
              alignSelf="center"
              marginBottom="$4"
            />

            <form onSubmit={this.handleRegister}>
              {!successful && (
                <YStack gap="$4" width="100%">
                  <Label htmlFor="username"></Label>
                  <Input
                    placeholder="Username"
                    size="$4"
                    backgroundColor={isUsernameValid ? "$lightBlue" : "$lightRed"}
                    value={username}
                    onChangeText={(text) => this.handleChange("username", text)}
                    onBlur={() => this.handleBlur("username", username)}
                    style={{ marginTop: 12 }}
                  />
                  {usernameError ? (<Text color="red">{usernameError}</Text>) : null}

                  <Label htmlFor="email"></Label>
                  <Input
                    placeholder="Email"
                    size="$4"
                    backgroundColor={isEmailValid ? "$lightBlue" : "$lightRed"}
                    value={email}
                    onChangeText={(text) => this.handleChange("email", text)}
                    onBlur={() => this.handleBlur("email", email)}
                    style={{ marginTop: 12 }}
                  />
                  {emailError ? (<Text color="red">{emailError}</Text>) : null}

                  <Label htmlFor="password"></Label>
                  <Input
                    placeholder="Password"
                    size="$4"
                    secureTextEntry
                    backgroundColor={isPasswordValid ? "$lightBlue" : "$lightRed"}
                    value={password}
                    onChangeText={(text) => this.handleChange("password", text)}
                    onBlur={() => this.handleBlur("password", password)}
                    style={{ marginTop: 12 }}
                  />
                  {passwordError ? (<Text color="red">{passwordError}</Text>) : null}

                  <CustomButton theme="red" disabled={!isFormValid || loading} enabled={isFormValid} style={{ marginTop: 24, borderRadius: 20 }}>
                    {loading ? (
                      <Text>Loading...</Text>
                    ) : (
                      <Text color="black">Sign Up</Text>
                    )}
                  </CustomButton>
                </YStack>
              )}

              {message && !message.includes('username') && !message.includes('email') && !message.includes('password') && <Text color="red">{message}</Text>}
            </form>
          </Stack>
        </YStack>
      </TamaguiProvider>
    );
  }
}
