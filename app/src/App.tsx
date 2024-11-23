import React, { Component } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Stack, YStack, XStack, Button, TamaguiProvider } from 'tamagui';
import Particles from "react-tsparticles";
// import { loadFull } from "tsparticles";
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

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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
      // showModeratorBoard: user?.roles?.includes("ROLE_MODERATOR") || false,
      // showAdminBoard: user?.roles?.includes("ROLE_ADMIN") || false,
    });
  }
  
  componentDidMount() {
    const user = AuthService.getCurrentUser();
  
    if (user) {
      this.setState({
        currentUser: user,
        // showModeratorBoard: user?.roles?.includes("ROLE_MODERATOR") || false,
        // showAdminBoard: user?.roles?.includes("ROLE_ADMIN") || false,
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
    const { currentUser } = this.state;

    // const particlesInit = async (main: any) => {
    //   await loadFull(main);
    // };

    return (
      <TamaguiProvider config={tamaguiConfig}>
        <div className="app-background">
          {/* Particle.js Background */}
          <Particles
            id="tsparticles"
            // init={particlesInit}
            options={{
              background: {
                color: {
                  value: "#000000",
                },
              },
              fpsLimit: 60,
              interactivity: {
                events: {
                  onClick: {
                    enable: true,
                    mode: "push",
                  },
                  onHover: {
                    enable: true,
                    mode: "repulse",
                  },
                  resize: true,
                },
                modes: {
                  push: {
                    quantity: 3,
                  },
                  repulse: {
                    distance: 100,
                    duration: 0.4,
                  },
                },
              },
              particles: {
                color: {
                  value: "#ffffff",
                },
                links: {
                  color: "#ffffff",
                  distance: 150,
                  enable: true,
                  opacity: 0.5,
                  width: 1,
                },
                collisions: {
                  enable: true,
                },
                move: {
                  direction: "none",
                  enable: true,
                  outModes: {
                    default: "bounce",
                  },
                  random: false,
                  speed: 1,
                  straight: false,
                },
                number: {
                  density: {
                    enable: true,
                    area: 800,
                  },
                  value: 69,
                },
                opacity: {
                  value: 0.5,
                },
                shape: {
                  type: "circle",
                },
                size: {
                  value: { min: 1, max: 5 },
                },
              },
              detectRetina: true,
            }}
          />

          <Stack space>
            <YStack backgroundColor="$darkGrey" padding="$3" height={80} justifyContent="center">
              <XStack justifyContent="space-between" alignItems="center">
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <Button backgroundColor="$lightBlue" size="$3" hoverStyle={{ backgroundColor: '$blue' }} fontWeight="bold" marginLeft="20px" borderRadius="$none" >Enrique Customs</Button>
                </Link>
                <XStack space="$3">
                  {currentUser ? (
                    <>
                      <Link to="/profile" style={{ textDecoration: 'none' }}>
                        <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} fontWeight="bold" marginRight="10px" size="$3" borderRadius="$none">{currentUser.username}</Button>
                      </Link>
                      <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} fontWeight="bold" marginRight="20px" size="$3" borderRadius="$none" onPress={this.logOut}>LogOut</Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} size="$3" marginRight="10px" borderRadius="$none">Login</Button>
                      </Link>
                      <Link to="/signup" style={{ textDecoration: 'none' }}>
                        <Button backgroundColor="$lightBlue" hoverStyle={{ backgroundColor: '$blue' }} size="$3" marginRight="20px" borderRadius="$none">Sign Up</Button>
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
                <Route path="/forgot" element={<ForgotPassword />} />
                <Route path="/api/auth/reset" element={<ResetPassword />} />
              </Routes>
            </Stack>
          </Stack>
        </div>
      </TamaguiProvider>
    );
  }
}

export default App;