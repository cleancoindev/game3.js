import React, { Component, Fragment } from "react";
import { Box, Flex, Text } from "rimble-ui";
import { Replay, Space, View} from "../components";
import { Constants, Database } from "@game3js/common";
import { refreshLeaderboard, getFileFromHash } from "../helpers/database";

interface IState {
  leaderboard: Array<Database.LeaderboardEntry>;
  replayingVideo: boolean;
  leaderboardTimer: any;
}
class PlayerGameReplays extends Component<any, IState> {
  public state: IState = {
    leaderboard: null,
    replayingVideo: false,
    leaderboardTimer: null    
  };

  private video: any;

   // BASE
 componentDidMount() {
  try {
    this.setState({
      leaderboardTimer: setInterval(this.updateLeaderboard, Constants.ROOM_REFRESH),
    }, this.updateLeaderboard);

    } catch (error) {
      console.error(error);
    }
  }

  updateLeaderboard = async () => { 
    const leaderboard =  await refreshLeaderboard();

    // format leaderboard for render

    this.setState({
      leaderboard,
    });
  }  

  handleReplayClick = async (hash: string) => {

    // start reading the file from DB
    const replayFile = await getFileFromHash(hash);

    const url = window.URL.createObjectURL(replayFile);

    this.video = document.querySelector('video');
    this.video.src = url;
    this.video.play();

    this.setState(
      {
        replayingVideo: true
      }
    )
  }

  renderReplays = () => {
    const {
      leaderboard,
    } = this.state;

    if (!leaderboard) {
      return (
        <View
          flex={true}
          center={true}
          style={{
            borderRadius: 8,
            backgroundColor: '#efefef',
            color: 'darkgrey',
            height: 128,
          }}
        >
          {'Refreshing Leaderboard attempts...'}
        </View>
      );
    }

    if (leaderboard.length <= 0) {
      return (
        <View
          flex={true}
          center={true}
          style={{
            borderRadius: 8,
            backgroundColor: '#efefef',
            color: 'darkgrey',
            height: 128,
          }}
        >
          {'No entries yet, start a game to join'}
        </View>
      );
    }

    

    return leaderboard.map(({time, id, hash}, index) => {
      return (
        <Fragment key={id}>
          <Replay
            id={id}
            time={time}
            hash={hash}
            onClick={this.handleReplayClick}
          />
          {(index !== leaderboard.length - 1) && <Space size="xxs" />}
        </Fragment>

     )
    });
  }

  render() {
    return (
      <>
        <Text my={4} />
        <Flex justifyContent={"space-between"} mx={-3} flexWrap={"wrap"}>
        Your Game Replays
        </Flex>
        <Flex justifyContent={"space-between"} mx={-3} flexWrap={"wrap"}>
          <video id="recorded" loop></video>                
        </Flex>

        <Box
          style={{
            width: 500,
            maxWidth: '100%',
          }}
        >
        {this.renderReplays()}
        </Box>
      </>                 
    )
  }
}

export default PlayerGameReplays;
