import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import Login from './pages/login';
import Home from './pages/home';

export const refreshAccess = () => {
  let refreshToken = localStorage.getItem("refresh_token") || "";

  let options = {
    headers: {
      Authorization: 'Bearer ' + refreshToken
    }
  };

  return axios.post('/auth/refresh', {}, options)
    .then(resp => {
        localStorage.setItem("access_token", resp.data["access_token"])
    });
};


export default class App extends Component {

  state = {
    data: "",
    reloadHandler: () => {
      this.setData();
    }
  };

  setData = () => {
    let accessToken = localStorage.getItem('access_token') || ""
    let refreshToken = localStorage.getItem('refresh_token') || ""


    if (accessToken !== "" && refreshToken !== "") {
      let options = {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      };
  
      axios.get("/users/get_users", options)
        .then(resp => {
          this.setState({data: resp.data["data"]});
        })
        .catch(error => {
          refreshAccess().then(resp => {
            return this.setData();
          });
        });
    }

  }

  componentDidMount() {
    this.setData();
  }

  render() {
    return this.state.data === "" ? <Login reloadHandler={this.state.reloadHandler} /> : <Home users={this.state.data} reloadHandler={this.state.reloadHandler} />
  }
}
