import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  state = {
    list: [],
  };

  click = (event) => {
    this.state.list.push(`Item ${this.state.list.length + 1}`);
    this.setState({});
  };

  render() {
    return (
      <>
        <button onClick={this.click}></button>
        {this.state.list.map(o => (
          <>
            <label>{o}</label><br/>
          </>
        ))}
      </>
    );
  }
}

export default App;