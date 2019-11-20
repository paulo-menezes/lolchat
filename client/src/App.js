import React, { Component } from 'react';
import classes from './App.module.css';
import { Card, CardContent, TextField, Fab, Typography, Button, CardActions,
    createMuiTheme, LinearProgress, List, ListItem, ListItemAvatar, Avatar,
    ListItemText, Paper, Divider, AppBar, Toolbar } from '@material-ui/core';
import SendIcon from '@material-ui/icons/Send';
import { ThemeProvider } from '@material-ui/styles';

const PROXY = `http://localhost:3000`;

export default class App extends Component {

  theme = createMuiTheme({
    palette: {
      type: 'dark',
    },
    typography: {
      fontFamily: 'Roboto'
    }
  });

  chatBottom = null;

  state = {
    isLoggedIn: false,
    loginProgress: false,
    nicknameError: null,
    passwordError: null,
    user: { nickname: '', password: '', friends: [] },
    selectedFriend: null,
    messageText: '',
    webSocket: null,
    messages: [],
    newFriend: ''
  };

  async signInOrSignUp(operation) {
    this.setState(
        { loginProgress: true, nicknameError: null, passwordError: null });
    const response = await fetch(`${PROXY}/user/${operation}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: this.state.user.nickname,
        password: this.state.user.password
      })
    });
    const user = await response.json();
    if (user.error) {
      if (user.error.includes('User')) {
        this.setState({ nicknameError: user.error, loginProgress: false });
      } else {
        this.setState({ passwordError: user.error, loginProgress: false });
      }
    } else {
      user.friends = [...new Set((user.messages || []).map(msg => {
        if (msg.from !== user.nickname) {
          return msg.from;
        } else {
          return msg.to;
        }
      }).reverse())];
      
      const webSocket = new WebSocket(
          `ws://localhost:3000`, 'lolchat-prot');
      webSocket.onmessage = (message) => {
        const msg = JSON.parse(message.data);
        if (msg.from === this.state.user.nickname ||
            msg.to === this.state.user.nickname) {
          const index = this.state.user.friends
              .indexOf(msg.from === this.state.user.nickname ? msg.to : msg.from);
          let friend = '';
          if (index < 0) {
            friend = msg.from === this.state.user.nickname ? msg.to : msg.from
          } else {
            friend = this.state.user.friends.splice(index, 1)[0];
          }
          this.state.user.friends.unshift(friend);
          this.setState({
            user: this.state.user,
            messages: [...this.state.messages, JSON.parse(message.data)]
          });
          this.chatBottom.scrollIntoView({ behavior: "smooth" });
        }
      };

      this.setState({
        user: user,
        messages: user.messages || [],
        loginProgress: false,
        isLoggedIn: true,
        webSocket: webSocket,
        selectedFriend: user.friends.length > 0 ? user.friends[0] : null
      });

      this.chatBottom.scrollIntoView({ behavior: "smooth" });
    }
  };

  async addFriend() {
    if (this.state.newFriend) {
      this.state.user.friends.unshift(this.state.newFriend);
      await fetch(`${PROXY}/user/add_friend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.state.user)
      });
      this.setState({ selectedFriend: this.state.newFriend, newFriend: '' });
    }
  }

  getLatestMessage(friend) {
    const messages = this.state.messages
        .filter(msg => msg.from === friend || msg.to === friend);
    if (messages.length > 0) {
      const message = messages.reverse()[0];
      return (
        <>
          <label>{message.text.substr(0, 20)}...</label><br/>
          <label>{new Date(message.createdAt).toLocaleString()}</label>
        </>
      );
    }
  }

  drawMessage(i, message) {
    return (
      <div key={i} style={{
          width: '100%',
          display: 'flex',
          flexDirection: message.from === this.state.user.nickname ? 'row-reverse' : 'row'
      }}>
        <Paper style={{
            margin: '10px',
            padding: '10px',
            width: 'fit-content',
            backgroundColor: message.from === this.state.user.nickname ? '' : 'cadetblue'
        }}>
          <Typography>{message.text}</Typography>
        </Paper>
      </div>
    );
  }

  async sendMessage() {
    this.state.webSocket.send(JSON.stringify({
      from: this.state.user.nickname,
      to: this.state.selectedFriend,
      text: this.state.messageText
    }));

    this.setState({ messageText: '' });
  }

  render() {
    return (
      <>
        <ThemeProvider theme={this.theme}>
          { !this.state.isLoggedIn && (
              <Card raised className={classes.loginCard}>
                { this.state.loginProgress &&
                  <LinearProgress></LinearProgress>
                }
                <CardContent>
                  <Typography variant="subtitle1">Login</Typography>
                  <TextField style={{width: '100%'}}
                    id="nickname"
                    label="Nickname"
                    margin="normal"
                    variant="filled"
                    disabled={this.state.loginProgress}
                    error={!!this.state.nicknameError}
                    helperText={this.state.nicknameError}
                    onChange={(event) => this.setState({ user: { nickname: event.target.value, password: this.state.user.password } })}
                    onKeyDown={(event) => event.key === 'Enter' && this.state.user.nickname
                        && this.state.user.password && this.signInOrSignUp('signin')}
                  />
                  <TextField style={{width: '100%'}}
                    id="password"
                    label="Password"
                    margin="normal"
                    variant="filled"
                    type="password"
                    disabled={this.state.loginProgress}
                    error={!!this.state.passwordError}
                    helperText={this.state.passwordError}
                    onChange={(event) => this.setState({ user: { nickname: this.state.user.nickname, password: event.target.value } })}
                    onKeyDown={(event) => event.key === 'Enter' && this.state.user.nickname
                        && this.state.user.password && this.signInOrSignUp('signin')}
                  />
                  <CardActions>
                    <div style={{width: '100%', display: 'flex', justifyItems: 'flex-end'}}>
                      <Button onClick={() => this.signInOrSignUp('signin')}
                          disabled={!this.state.user.nickname || !this.state.user.password || this.state.loginProgress}>
                        Sign In
                      </Button>
                      <Button onClick={() => this.signInOrSignUp('signup')}
                          disabled={!this.state.user.nickname || !this.state.user.password || this.state.loginProgress}>
                        Sign Up
                      </Button>
                    </div>
                  </CardActions>
                </CardContent>
              </Card>
          )}
          { this.state.isLoggedIn && (
            <div>
              <AppBar position="static" style={{flexGrow: 1}}>
                <Toolbar style={{position: 'relative'}}>
                  <Typography variant="h6">Chat</Typography>
                  <div style={{position: 'absolute', right: 0}}>
                    <TextField label="Nickname"
                      onChange={(event) => this.setState({ newFriend: event.target.value })}/>
                    <Button color="inherit" style={{marginTop: 10}}
                      onClick={() => this.addFriend()}>Add Friend</Button>
                  </div>
                </Toolbar>
              </AppBar>
              <div style={{display: 'flex', flexDirection: 'row'}}>
                <List className={classes.friendsList}>
                  { this.state.user.friends.map(friend => (
                      <div key={friend} onClick={() => this.setState({ selectedFriend: friend })}>
                        <ListItem className={classes.friendItem} style={{backgroundColor: friend === this.state.selectedFriend ? 'cornflowerblue' : ''}}>
                          <ListItemAvatar>
                            <Avatar>
                              {friend.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText style={{color: 'white'}} primary={friend.toUpperCase()} secondary={this.getLatestMessage(friend)}  />
                        </ListItem>
                        <Divider />
                      </div>
                    ))
                  }
                </List>
                <div style={{width: '100%', height: '94vh', display: 'flex', flexDirection: 'column'}}>
                  <div style={{width: '100%', maxHeight: '80vh', height: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
                    { this.state.messages
                        .filter(msg => msg.from === this.state.selectedFriend || msg.to === this.state.selectedFriend)
                        .map((msg, i) => this.drawMessage(i, msg))
                    }
                    <div ref={(el) => { this.chatBottom = el; }}>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'row', margin: 10}}>
                    <TextField style={{width: '100%', maxHeight: '300px'}}
                      id="message"
                      label="Write a message"
                      margin="normal"
                      variant="filled"
                      value={this.state.messageText}
                      multiline
                      rows="4"
                      onChange={(event) => this.setState({ messageText: event.target.value })}
                      onKeyUp={(event) => event.key === 'Enter' && this.sendMessage()}/>
                    <Fab color="primary" style={{marginTop: 12, marginLeft: 10}}
                        onClick={() => this.sendMessage()}>
                      <SendIcon />
                    </Fab>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ThemeProvider>
      </>
    );
  }
}