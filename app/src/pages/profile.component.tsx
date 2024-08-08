import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import IUser from "../types/user.type";
import { Stack, Text, YStack } from 'tamagui';
import { FileUpload } from './dap_ui/components/FileUpload/index'; // Import FileUpload component
import { JobProvider } from './dap_ui/components/JobInput/JobContext'; // Import JobContextProvider component

type Props = {};

type State = {
  redirect: string | null,
  userReady: boolean,
  currentUser: IUser & { accessToken: string }
}

export default class Profile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: AuthService.getCurrentUser()
    };
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      this.setState({ redirect: "/login" });
    } else {
      this.setState({ currentUser, userReady: true });
    }
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />
    }

    const { currentUser, userReady } = this.state;

    return (
      <YStack padding="$4" space="$4">
        {userReady ? (
          <Stack>
            <Stack>
              <Text fontSize="$6" fontWeight="bold">
                <strong>{currentUser.username}</strong> Profile
              </Text>
            </Stack>
            <Text>
              <strong>Token:</strong> {currentUser.accessToken.substring(0, 20)} ... {currentUser.accessToken.substring(currentUser.accessToken.length - 20)}
            </Text>
            <Text>
              <strong>Id:</strong> {currentUser.id}
            </Text>
            <Text>
              <strong>Email:</strong> {currentUser.email}
            </Text>
            <Text>
              <strong>Authorities:</strong>
            </Text>
            <YStack space="$2">
              {currentUser.roles && currentUser.roles.map((role, index) => (
                <Text key={index}>- {role}</Text>
              ))}
            </YStack>
            
            {/* Adding Document Automation UI Components */}
            <JobProvider>
              <FileUpload />
            </JobProvider>
            
          </Stack>
        ) : null}
      </YStack>
    );
  }
}