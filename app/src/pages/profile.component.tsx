import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import IUser from "../types/user.type";
import { Stack, Text, YStack, Card } from 'tamagui';
import { FileUpload } from './dap_ui/components/FileUpload/index';
import { JobInput } from './dap_ui/components/JobInput';
import { JobProvider } from './dap_ui/components/JobInput/JobContext';
import ClientDataTable from './dap_ui/components/ClientDataTable/ClientDataTable';

type Props = {};

type State = {
  redirect: string | null,
  userReady: boolean,
  currentUser: IUser & { accessToken: string },
  shadowStyle: { left: number, top: number, opacity: number }
}

export default class Profile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: AuthService.getCurrentUser(),
      shadowStyle: { left: 0, top: 0, opacity: 0 }
    };
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      this.setState({ redirect: "/login" });
    } else {
      this.setState({ currentUser, userReady: true });
    }

    // Shadow effect logic
    const titleElement = document.getElementById('title');
    const handleMouseMove = (event: MouseEvent) => {
      if (titleElement) {
        const { left, top, width, height } = titleElement.getBoundingClientRect();
        if (event.clientX >= left && event.clientX <= left + width && event.clientY >= top && event.clientY <= top + height) {
          const letterWidth = width / titleElement.innerText.length;
          const mouseX = event.clientX - left;
          const letterIndex = Math.floor(mouseX / letterWidth);
          const letterLeft = left + letterWidth * letterIndex;

          this.setState({
            shadowStyle: {
              left: letterLeft,
              top: top + height - 20,
              opacity: 1,
            },
          });
        } else {
          this.setState((prevState) => ({
            shadowStyle: { ...prevState.shadowStyle, opacity: 0 }
          }));
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />;
    }

    const { currentUser, userReady, shadowStyle } = this.state;

    return (
      <YStack padding="$4" space="$4" alignItems="center">
        {userReady ? (
          <Card backgroundColor="$gray9" padding="$4" borderRadius="$4" width="100%">
            <YStack space="$4">
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

              {/* Shadow Box */}
              <Stack
                id="shadow-box"
                style={{
                  position: 'absolute',
                  width: '85px',
                  height: '30px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '5px',
                  filter: 'blur(10px)',
                  pointerEvents: 'none',
                  transition: 'left 0.3s ease-out, top 0.3s ease-out, opacity 0.2s ease-out',
                  ...shadowStyle,
                }}
              ></Stack>

              <Text
                id="title"
                style={{
                  color: '#1338BE',
                  textAlign: 'center',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 'bold',
                  position: 'relative',
                  zIndex: 1,
                  marginBottom: '20px',
                }}
              >
                Enrique's Customs
              </Text>

              {/* Document Automation UI Components */}
              <JobProvider>
                <YStack space="$4">
                  <Card padding="$4" backgroundColor="$gray7" borderRadius="$4">
                    <JobInput />
                  </Card>
                  <Card padding="$4" backgroundColor="$gray7" borderRadius="$4">
                    <FileUpload />
                  </Card>
                </YStack>
                <Card padding="$4" backgroundColor="$gray7" borderRadius="$4" marginTop="$4">
                  <ClientDataTable />
                </Card>
              </JobProvider>
            </YStack>
          </Card>
        ) : null}
      </YStack>
    );
  }
}
