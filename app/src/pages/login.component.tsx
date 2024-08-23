import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import { Stack, Input, Label, Text, YStack, Image, TamaguiProvider } from 'tamagui';
import { CustomButton } from "../components/CustomButton";
import tamaguiConfig from '../tamagui.config';
import IUser from '../types/user.type';

type Props = {
  onLogin: (user: IUser) => void;
};

type State = {
  redirect: string | null,
  username: string,
  password: string,
  loading: boolean,
  message: string,
  isUsernameValid: boolean,
  isPasswordValid: boolean,
  usernameError: string,
  passwordError: string,
  successful: boolean, // Added successful to the State type
};

export default class Login extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.handleLogin = this.handleLogin.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    this.state = {
      redirect: null,
      username: "",
      password: "",
      loading: false,
      message: "",
      isUsernameValid: false,
      isPasswordValid: false,
      usernameError: "",
      passwordError: "",
      successful: false, // Initialize successful in the state
    };
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();

    if (currentUser) {
      this.setState({ redirect: "/profile" });
    }
  }

  validateFields(name: string, value: string) {
    let isValid = false;
    let error = "";
    switch (name) {
      case "username":
        isValid = value.length > 0;
        error = isValid ? "" : "This field is required!";
        this.setState({ isUsernameValid: isValid, usernameError: error });
        break;
      case "password":
        isValid = value.length > 0;
        error = isValid ? "" : "This field is required!";
        this.setState({ isPasswordValid: isValid, passwordError: error });
        break;
      default:
        break;
    }
    return isValid;
  }

  handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { username, password } = this.state;

    const isUsernameValid = this.validateFields("username", username);
    const isPasswordValid = this.validateFields("password", password);

    if (!isUsernameValid || !isPasswordValid) {
      this.setState({ message: "Please fill out all fields correctly.", successful: false });
      return;
    }

    this.setState({
      message: "",
      loading: true
    });

    AuthService.login(username, password).then(
      (user: IUser) => {
        this.setState({
          redirect: "/profile",
          successful: true,
        });
        this.props.onLogin(user);
      },
      error => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();

        this.setState({
          loading: false,
          message: resMessage
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
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { loading, message, username, password, isUsernameValid, isPasswordValid, usernameError, passwordError, successful } = this.state;
    const isFormValid = isUsernameValid && isPasswordValid;

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

            <form onSubmit={this.handleLogin}>
              {!successful && (
                <YStack gap="$4" width="100%" paddingHorizontal="$4">
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

                  <CustomButton theme="red" disabled={!isFormValid || loading} enabled={isFormValid} style={{ marginTop: 24 }}>
                    {loading ? (
                      <Text>Loading...</Text>
                    ) : (
                      <Text color="black">Login</Text>
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
