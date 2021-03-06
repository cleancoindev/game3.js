import React, { Component } from 'react'

import { Box, Card, Flex, Heading } from "rimble-ui"

import { getGameSession } from '../helpers/database'
import { navigateTo } from '../helpers/utilities';
import shortenAddress from "../core/utilities/shortenAddress"

import { RouteComponentProps } from '@reach/router';
import qs from 'querystringify';

import CSS from 'csstype';
import {baseColors, fonts, shadows, } from '../styles';

import { 
  TOURNAMENT_STATE_ACTIVE, 
  TOURNAMENT_STATE_ENDED, 
  TOURNAMENT_STATE_DRAFT
} from '../constants'

class TournamentResultsCard extends Component<any, any> {
  constructor(props) {
    super(props)

    this.state = {
      results: [],
      tournament: {},
      isLoading: false
    }
  }

  componentDidMount() {
    this.getBlockchainInfo(this.props)
  }

  componentWillReceiveProps(newProps) {
    const { tournamentId, address } = this.props
    const { tournamentId: newId, address: newAddress } = newProps

    if (tournamentId !== newId || address !== newAddress) {
      this.getBlockchainInfo(newProps)
    }
  }

  async getTournamentAndLeaderBoards(tournamentId: any) {
    const { drizzle } = this.props;

    this.setState({ isLoading: true })

    console.log(`getBlockchainInfo: ${tournamentId}`)
    const contract = drizzle.contracts.Tournaments;

    // Get tournament info
    const raw = await contract.methods.getTournament(tournamentId).call()
    const tournament = {
      id: tournamentId,
      name: 'My Tournament',
      timeZone: 'UTC',
      startTime: '12:00',
      endTime: parseInt(raw['1']),
      startDate: '8/16',
      endDate: '9/4',
      state: parseInt(raw['3']),
    }

    // Get tournament results
    const resultsCount = await contract.methods.getResultsCount(tournamentId).call()
    let results = []
    for (let resultIdx = 0; resultIdx < resultsCount; resultIdx++) {
    const rawResult = await contract.methods.getResult(tournamentId, resultIdx).call()
      results.push({
        tournamentId: tournamentId,
        resultId: resultIdx,
        isWinner: rawResult['0'],
        timeIsUp: false,
        playerAddress: rawResult['1'],
        sessionId: rawResult['2'],
      })
    }

    const promises = results.map(result => getGameSession(result.sessionId, result.playerAddress))
    const sessions = await Promise.all(promises)
    results.forEach((result, idx) => result.sessionData = sessions[idx])
    results = results.filter(result => !!result.sessionData)
    results.sort((el1, el2) => el2.sessionData.timeLeft - el1.sessionData.timeLeft)

    // temp: placeholder results for demo
    results = 
    [
      {
        playerAddress: "0x40848f628B796690502b1F3Da5C31Ea4b4FD838C",
        sessionData: {
          timeLeft: "0:55"
        }
      },
      {
        playerAddress: "0xB83A97B94A7f26047cBDBAdf5eBe53224Eb12fEc",
        sessionData: {
          timeLeft: "0:50"
        }
      },
      {
        playerAddress: "0x9DFb1d585F8C42933fF04C61959b079027Cf88bb",
        sessionData: {
          timeLeft: "0:30"
        }
      }
    ]

    this.setState({
      results,
      tournament,
      isLoading: false
    })
  }

  getBlockchainInfo = async (props) => {
    const { tournamentId, drizzle } = props

    // Get the latest tournament
    const contract = drizzle.contracts.Tournaments;

    const tournamentLength = await contract.methods.getTournamentsCount().call();
    let tI = tournamentId ? tournamentId : tournamentLength - 1;

    await this.getTournamentAndLeaderBoards(tI);
  }

  getStatus(tournament: any) {
    switch (tournament.state) {
      case TOURNAMENT_STATE_DRAFT:
          return 'Draft'
        break;
      case TOURNAMENT_STATE_ACTIVE:
          return 'Ongoing'
        break;
      case TOURNAMENT_STATE_ENDED:
          return 'Done'
        break;
      default:
        break;
    }
  }


  formatTourneyInfo(tournament: any) {
    const {
      startDate,
      endDate,
      startTime,
      timeZone
    } = tournament;
    let info = 
    `${this.getStatus(tournament)} (${startDate} to ${endDate} ${startTime} ${timeZone})`;

    return info;
  }

  // Formats the title of the tournament along with its ID 
  formatTourneyTitle(tournament: any) {
    return `${tournament.name} #${tournament.id}`;
  }

  handleJoinClick = () => {
    const { tournament } = this.state
    console.log('Join Tournament')
    // TODO
  }

  render () {
    const { results, isLoading, tournament } = this.state;
    const { tournamentId } = this.props;

    if (isLoading) {
      return (
        <div style={divLoadingStyle}>
          Loading...
        </div>
      )
    }

    const resultDivs = results.map(result => (result.sessionData && (
      <div style={resultDivStyle} key={result.playerAddress}>
        <span style={playerAddressStyle}>
          { shortenAddress(result.playerAddress) }
        </span>
        <span style={timeLeftStyle}>
          { result.sessionData.timeLeft }
        </span>
      </div>
    )) || null )

    return (
      <div style={widgetStyle}>
        <div style={tournamentInfoStyle}>
          <span style={tourneyTitleStyle}>{this.formatTourneyTitle(tournament)}</span>
          <span style={tourneyTitleInfo}>{this.formatTourneyInfo(tournament)}</span>
        </div>  
        <div style={leaderBoardStyle}>
          <h1 style={titleHeader}>Leaderboard</h1>
          <div style={resultDivsStyle}>
            { resultDivs }
          </div>
        </div>
        {tournamentId === undefined && (
          <button style={joinTourneyBtn} onClick={this.handleJoinClick}>JOIN TOURNAMENT</button>
        )}
      </div>
    )
  }
}

const widgetStyle: CSS.Properties = {
  width: '100%',
  height: '100%',
  padding: '0.8rem 1rem',
  justifyContent: 'center',
}

const leaderBoardStyle: CSS.Properties = {
  width: '100%',
  padding: '0.8rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  margin: '1rem 0',
  background: `rgb(${baseColors.white})`,
  boxShadow: shadows.soft,
  justifyContent: 'center',
  borderRadius: '7px'
}

const divLoadingStyle: CSS.Properties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const titleHeader: CSS.Properties = {
  textTransform: 'uppercase',
  fontFamily: fonts.family.ApercuBold,
  margin: '1rem auto',
  fontSize: fonts.size.h4,
  fontWeight: fonts.weight.medium,
  color: `rgb(${baseColors.dark})`
}

const resultDivsStyle: CSS.Properties = {
  width: '100%',
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}

const resultDivStyle: CSS.Properties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '0 0 1rem 0'
}

const playerAddressStyle: CSS.Properties = {
  fontSize: fonts.size.medium,
  color: `rgb(${baseColors.dark})`,
  fontFamily: fonts.family.ApercuBold
}

const timeLeftStyle: CSS.Properties = {
  fontSize: fonts.size.medium,
  color: `rgb(${baseColors.lightBlue})`,
  fontFamily: fonts.family.ApercuBold
}

const tournamentInfoStyle: CSS.Properties = {
  width: '100%',
  background: `rgb(${baseColors.orange})`,
  padding: '0.9rem',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: shadows.soft,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '7px'
}

const tourneyTitleStyle: CSS.Properties = {
  fontSize: fonts.size.h5,
  fontFamily: fonts.family.ApercuBold,
  color: `rgb(${baseColors.dark})`,
  margin: '5px'
}

const tourneyTitleInfo: CSS.Properties = {
  fontSize: fonts.size.medium,
  fontFamily: fonts.family.ApercuLight,
  color: `rgb(${baseColors.dark})`
}

const joinTourneyBtn: CSS.Properties = {
  fontSize: fonts.size.medium,
  fontFamily: fonts.family.ApercuBold,
  color: `rgb(${baseColors.dark})`,
  background: `rgb(${baseColors.yellow})`,
  padding: '1rem 0.9rem',
  width: '100%',
  cursor: 'pointer',
  outline: 'none',
  border: 'none',
  borderRadius: '7px'
}

export default TournamentResultsCard