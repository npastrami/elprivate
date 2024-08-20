import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import IUser from "../types/user.type";
import { Stack, Text, YStack, Card, Button, XStack } from 'tamagui';
import { FileUpload } from './dap_ui/components/FileUpload/index';
import { JobInput } from './dap_ui/components/JobInput';
import { JobProvider } from './dap_ui/components/JobInput/JobContext';
import ClientDataTable from './dap_ui/components/ClientDataTable/ClientDataTable';
import ReviewWorkpapers from './dap_ui/components/FileUpload/ReviewWorkpapers';

type Props = {};

type State = {
  redirect: string | null,
  userReady: boolean,
  currentUser: IUser & { accessToken: string },
  shadowStyle: { left: number, top: number, opacity: number },
  activeTab: string
}

export default class Profile extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      redirect: null,
      userReady: false,
      currentUser: AuthService.getCurrentUser(),
      shadowStyle: { left: 0, top: 0, opacity: 0 },
      activeTab: "upload"  // Default to "upload"
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

  handleTabClick = (tab: string) => {
    this.setState({ activeTab: tab });
  }

  renderContent() {
    const { currentUser, userReady, activeTab } = this.state;

    if (!userReady) return null;

    switch (activeTab) {
      case "settings":
        return (
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
                {currentUser.roles?.map((role, index) => (
                  <Text key={index}>- {role}</Text>
                ))}
              </YStack>
            </YStack>
          </Card>
        );

      case "upload":
        return (
          <JobProvider>
            <YStack space="$4">
              <Card padding="$4" backgroundColor="$gray7" borderRadius="$4" style={{paddingTop: '10px'}}>
                <JobInput />
              </Card>
              <Card padding="$4" backgroundColor="$gray7" borderRadius="$4">
                <FileUpload />
              </Card>
            </YStack>
          </JobProvider>
        );

      case "review":
        return currentUser.roles?.includes('ROLE_ADMIN') ? (
          <JobProvider>
            <YStack space="$4">
              <Card padding="$4" backgroundColor="$gray7" borderRadius="$4" style={{paddingTop: '10px'}}>
                <JobInput />
              </Card>
              <Card padding="$4" backgroundColor="$gray7" borderRadius="$4" marginTop="$4">
                <h3>Review Workpapers</h3>
                <ReviewWorkpapers clientId={currentUser.id} />
              </Card>
            </YStack>
          </JobProvider>
        ) : <Text>Under Construction</Text>;

      case "schedule":
        return (
          <JobProvider>
            <Card
              padding="$4"
              backgroundColor="$gray7"
              borderRadius="$4"
              style={{
                maxHeight: '800px',
                minHeight: '400px', // Ensure the card has a minimum height
                minWidth: '600px',  // Set a minimum width for the card
                overflowY: 'auto',
                paddingTop: '10px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ flexGrow: 0 }}>
                <JobInput />
              </div>
              <div style={{ flexGrow: 1 }}>
                <ClientDataTable />
              </div>
            </Card>
          </JobProvider>
        );

      case "results":
      case "billing":
      case "setup":
        return <Text>Under Construction</Text>;

      default:
        return <Text>Invalid Tab</Text>;
    }
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />;
    }

    const { currentUser, shadowStyle } = this.state;

    return (
      <YStack padding="$4" space="$4" alignItems="center">
        {this.state.userReady ? (
          <>
            <nav style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <XStack space="$2">
                {currentUser.roles?.includes('ROLE_ADMIN') ? (
                  <>
                    <Button onPress={() => this.handleTabClick("settings")} style={{ borderRadius: 0, padding: '10px 20px' }}>Settings</Button>
                    <Button onPress={() => this.handleTabClick("upload")} style={{ borderRadius: 0, padding: '10px 20px' }}>Upload</Button>
                    <Button onPress={() => this.handleTabClick("review")} style={{ borderRadius: 0, padding: '10px 20px' }}>Review</Button>
                    <Button onPress={() => this.handleTabClick("schedule")} style={{ borderRadius: 0, padding: '10px 20px' }}>Schedule</Button>
                  </>
                ) : (
                  <>
                    <Button onPress={() => this.handleTabClick("setup")} style={{ borderRadius: 0, padding: '10px 20px' }}>Setup</Button>
                    <Button onPress={() => this.handleTabClick("settings")} style={{ borderRadius: 0, padding: '10px 20px' }}>Settings</Button>
                    <Button onPress={() => this.handleTabClick("upload")} style={{ borderRadius: 0, padding: '10px 20px' }}>Upload</Button>
                    <Button onPress={() => this.handleTabClick("results")} style={{ borderRadius: 0, padding: '10px 20px' }}>Results</Button>
                    <Button onPress={() => this.handleTabClick("billing")} style={{ borderRadius: 0, padding: '10px 20px' }}>Billing</Button>
                  </>
                )}
              </XStack>
            </nav>

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

            {/* Render Content Based on Tab */}
            {this.renderContent()}
          </>
        ) : null}
      </YStack>
    );
  }
}
