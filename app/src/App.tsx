import React, { Component } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Stack, YStack, XStack, Button, TamaguiProvider } from 'tamagui';
import './App.css';

import AuthService from "./services/auth.service";
import IUser from './types/user.type';

import Login from "./pages/login.component";
import Register from "./pages/register.component";
import Home from "./pages/home.component";
import Profile from "./pages/profile.component";
import BoardUser from "./pages/board-user.component";
import BoardModerator from "./pages/board-moderator.component";
import BoardAdmin from "./pages/board-admin.component";
import tamaguiConfig from './tamagui.config';

type Props = {};

type State = {
  showModeratorBoard: boolean,
  showAdminBoard: boolean,
  currentUser: IUser | undefined
}

class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.logOut = this.logOut.bind(this);
    this.handleLogin = this.handleLogin.bind(this);

    this.state = {
      showModeratorBoard: false,
      showAdminBoard: false,
      currentUser: undefined,
    };
  }

  handleLogin(user: IUser) {
    this.setState({
      currentUser: user,
      showModeratorBoard: user?.roles?.includes("ROLE_MODERATOR") || false,
      showAdminBoard: user?.roles?.includes("ROLE_ADMIN") || false,
    });
  }
  
  componentDidMount() {
    const user = AuthService.getCurrentUser();
  
    if (user) {
      this.setState({
        currentUser: user,
        showModeratorBoard: user?.roles?.includes("ROLE_MODERATOR") || false,
        showAdminBoard: user?.roles?.includes("ROLE_ADMIN") || false,
      });
    }
  }

  logOut() {
    AuthService.logout();
    this.setState({
      currentUser: undefined,
      showModeratorBoard: false,
      showAdminBoard: false,
    });
    window.location.href = '/login';
  }

  render() {
    const { currentUser, showModeratorBoard, showAdminBoard } = this.state;

    return (
      <TamaguiProvider config={tamaguiConfig}>
        <Stack space className="app-background">
          <YStack backgroundColor="$darkGrey" padding="$3" height={80} justifyContent="center">
            <XStack justifyContent="space-between" alignItems="center">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2" fontWeight="bold" >Enrique Customs</Button>
              </Link>
              <XStack space="$3">
                <Link to="/home" style={{ textDecoration: 'none' }}>
                  <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">Home</Button>
                </Link>

                {showModeratorBoard && (
                  <Link to="/mod" style={{ textDecoration: 'none' }}>
                    <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">Moderator Board</Button>
                  </Link>
                )}

                {showAdminBoard && (
                  <Link to="/admin" style={{ textDecoration: 'none' }}>
                    <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">Admin Board</Button>
                  </Link>
                )}

                {currentUser && (
                  <Link to="/user" style={{ textDecoration: 'none' }}>
                    <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">User</Button>
                  </Link>
                )}
              </XStack>
              <XStack space="$3">
                {currentUser ? (
                  <>
                    <Link to="/profile" style={{ textDecoration: 'none' }}>
                      <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">{currentUser.username}</Button>
                    </Link>
                    <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2" onPress={this.logOut}>LogOut</Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                      <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">Login</Button>
                    </Link>
                    <Link to="/signup" style={{ textDecoration: 'none' }}>
                      <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} color="$color" borderRadius="$2">Sign Up</Button>
                    </Link>
                  </>
                )}
              </XStack>
            </XStack>
          </YStack>

          <Stack padding="$3">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login onLogin={this.handleLogin}/>} />
              <Route path="/signup" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user" element={<BoardUser />} />
              <Route path="/mod" element={<BoardModerator />} />
              <Route path="/admin" element={<BoardAdmin />} />
            </Routes>
          </Stack>
        </Stack>
      </TamaguiProvider>
    );
  }
}

export default App;
