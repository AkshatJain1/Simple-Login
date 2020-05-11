import React, { Component } from 'react';
import axios from 'axios';

export default class Login extends Component {
    state = {
        email: "",
        password: "",
        wrongLogin: false,
        serverError: false,
    };

    onChange = e => {
        this.setState({
            [e.target.name]: e.target.value
        });
    };

    onSubmit = e => {
        e.preventDefault();
        this.setState({logging: true});

        const user = {
            email: this.state.email,
            password: this.state.password
        };
        
        axios.post('/auth/login', user)
            .then(resp => {
                resp = resp.data;
                if ("access_token" in resp) {
                    localStorage.setItem("access_token", resp["access_token"]);
                    localStorage.setItem("refresh_token", resp["refresh_token"]);
                    this.props.reloadHandler();
                } else {
                    this.setState({wrongLogin: true, logging: false});
                }
            })
            .catch(error => {
                this.setState({serverError: true, logging: false});
            })
    }

    

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-6 mt-5 mx-auto">
                        <form noValidate onSubmit={this.onSubmit}>
                            <h1 className="h3 mb-3 font-weight-normal">Please sign in</h1>
                            { this.state.logging
                                ? (
                                    <div className="text-center">
                                        <div className="spinner-border" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </div>
                                    </div>
                                )
                                : (
                                    <>
                                        { this.state.wrongLogin 
                                            ? (
                                                <div class="alert alert-danger" role="alert">
                                                    <strong>Oh snap!</strong> Wrong email or password detected
                                                </div>
                                            ) : (<></>)
                                        }
                                        { this.state.serverError 
                                            ? (
                                                <div class="alert alert-danger" role="alert">
                                                    <strong>Oh snap!</strong> I did something wrong :(
                                                </div>
                                            ) : (<></>)
                                        }
                                        <div className="form-group">
                                            <label htmlFor="email">Email Address</label>
                                            <input type="email"
                                                className="form-control"
                                                name="email"
                                                placeholder="Enter Email"
                                                value={this.state.email}
                                                onChange={this.onChange} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="password">Password </label>
                                            <input type="password"
                                                className="form-control"
                                                name="password"
                                                placeholder="Enter Password"
                                                value={this.state.password}
                                                onChange={this.onChange} />
                                        </div>
                                        
                                        <button type="submit" className="btn btn-lg btn-primary btn-block">
                                            Sign in
                                        </button>
                                    </>
                                )
                            }
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}