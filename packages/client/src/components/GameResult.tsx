import * as React from 'react'

import { RouteComponentProps } from '@reach/router'

import Modal from './Modal'
import { View, Button } from '../components'

import { getGameSession, putGameReplay } from '../helpers/database'

export default class GameResult extends React.Component<any, any> {
  constructor(props) {
    super(props)

    this.state = {
      sessionData: null,
    }
  }

  componentDidMount = () => {
    const { gameSessionId, playerAddress } = this.props
    this.updateScore(gameSessionId, playerAddress)
  }

  componentWillReceiveProps = (newProps) => {
    const { gameSessionId, playerAddress } = this.props
    const { gameSessionId: newGameSessionId, 
      playerAddress: newPlayerAddress } = newProps

    if (gameSessionId !== newGameSessionId ||
      playerAddress !== newPlayerAddress) {
      this.updateScore(newGameSessionId, newPlayerAddress)
    }
  }

  updateScore = async (gameSessionId, playerAddress) => {
    if (!gameSessionId || !playerAddress) {
      return
    }
    const sessionData = await getGameSession(gameSessionId, playerAddress)
    this.setState({
      sessionData
    })
  }

  submitResult = async () => {
    const { tournamentId, recordFileHash, playerAddress,
      onToggle, gameSessionId, contractMethodSendWrapper } = this.props

    const result = await putGameReplay(gameSessionId, playerAddress, recordFileHash)
    console.log(result)

    contractMethodSendWrapper(
      "submitResult", // name
      [tournamentId, gameSessionId], //contract parameters
      {from: playerAddress}, // send parameters
      (txStatus, transaction) => { // callback
        console.log("submitResult callback: ", txStatus, transaction);
      })
    onToggle(true)
  }

  render () {
    const { show, onToggle } = this.props
    const { sessionData } = this.state

    const score = (sessionData && sessionData.timeLeft) || ''

    return (
      <Modal show={show} toggleModal={onToggle}>
        <View style={{ margin: '20px' }}>Game result: {score}</View>
        <View style={{ display: 'flex', flexDirection: 'row', width: '100%', margin: '0px auto'}}>
          <Button onClick={this.submitResult}>Submit score</Button>
        </View>
      </Modal>
    )
  }
}