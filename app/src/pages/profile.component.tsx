import React, { Component } from "react";
import { Navigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import IUser from "../types/user.type";
import { Text, YStack, Card, XStack } from 'tamagui';
import { FileUpload } from './dap_ui/components/FileUpload/index';
import { JobInput } from './dap_ui/components/JobInput';
import { JobProvider } from './dap_ui/components/JobInput/JobContext';
import ClientDataTable from './dap_ui/components/ClientDataTable/ClientDataTable';
import Settings from './dap_ui/components/Profile/settings';
import ReviewWorkpapers from './dap_ui/components/FileUpload/ReviewWorkpapers';
import ClientSetup from './dap_ui/components/ClientSetup/ClientSetup';
import NavButton from './NavButton';

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
  }

  handleTabClick = (tab: string) => {
    this.setState({ activeTab: tab });
  }

  handleUpdateUser = (updatedUser: IUser & { accessToken: string }) => {
    this.setState({ currentUser: updatedUser });
  }

  renderContent() {
    const { currentUser, userReady, activeTab } = this.state;

    if (!userReady) return null;

    switch (activeTab) {
      case "settings":
        return (
          <Settings currentUser={currentUser} onUpdateUser={this.handleUpdateUser} />
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
      case "setup":
        return <ClientSetup />;

      case "results":
      case "billing":
        return <Text>Under Construction</Text>;

      default:
        return <Text>Invalid Tab</Text>;
    }
  }

  render() {
    if (this.state.redirect) {
      return <Navigate to={this.state.redirect} />;
    }

    const { currentUser, activeTab } = this.state;

    return (
      <YStack padding="$4" space="$4" alignItems="center">
        {this.state.userReady && (
          <>
            <nav style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <XStack space="$2">
                {currentUser.roles?.includes('ROLE_ADMIN') ? (
                  <>
                    <NavButton label="Settings" active={activeTab === "settings"} onClick={() => this.handleTabClick("settings")} />
                    <NavButton label="Upload" active={activeTab === "upload"} onClick={() => this.handleTabClick("upload")} />
                    <NavButton label="Review" active={activeTab === "review"} onClick={() => this.handleTabClick("review")} />
                    <NavButton label="Schedule" active={activeTab === "schedule"} onClick={() => this.handleTabClick("schedule")} />
                  </>
                ) : (
                  <>
                    <NavButton label="Setup" active={activeTab === "setup"} onClick={() => this.handleTabClick("setup")} />
                    <NavButton label="Settings" active={activeTab === "settings"} onClick={() => this.handleTabClick("settings")} />
                    <NavButton label="Upload" active={activeTab === "upload"} onClick={() => this.handleTabClick("upload")} />
                    <NavButton label="Results" active={activeTab === "results"} onClick={() => this.handleTabClick("results")} />
                    <NavButton label="Billing" active={activeTab === "billing"} onClick={() => this.handleTabClick("billing")} />
                  </>
                )}
              </XStack>
            </nav>
            {this.renderContent()}
          </>
        )}
      </YStack>
    );
  }
}