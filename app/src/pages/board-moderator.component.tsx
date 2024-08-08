import React, { Component } from "react";
import { Stack, Text, YStack } from 'tamagui';
import UserService from "../services/user.service";
import EventBus from "../common/EventBus";

type Props = {};

type State = {
  content: string;
}

export default class BoardAdmin extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      content: ""
    };
  }

  componentDidMount() {
    UserService.getModeratorBoard().then(
      response => {
        const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        this.setState({ content });
      },
      error => {
        this.setState({
          content:
            (error.response &&
              error.response.data &&
              error.response.data.message) ||
            error.message ||
            error.toString()
        });

        if (error.response && error.response.status === 401) {
          EventBus.dispatch("logout");
        }
      }
    );
  }

  render() {
    return (
      <YStack padding="$4" alignItems="center" justifyContent="center">
        <Stack>
          <Text fontSize="$6" fontWeight="bold">
            {this.state.content}
          </Text>
        </Stack>
      </YStack>
    );
  }
}
