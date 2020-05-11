import React, { Component } from 'react';
import axios from 'axios';
import DataGrid from 'react-data-grid';
import 'react-data-grid/dist/react-data-grid.css';
import { refreshAccess } from '../../App';
import './index.css';

class Modal extends Component {
    state={
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: ""
    }

    onChange = e => {
        this.setState({
            [e.target.name]: e.target.value
        });
    };

    render() {
        if(!this.props.show){
            return null;
        }
        return (
            <div className="modal" id="modal">
                <h2>Add User</h2>
                <form noValidate onSubmit={(e) => this.props.onSubmit(e, this.state)}>
                    <div className="content">
                        <div className="container">
                            <div className="row">
                                <div className="col-md-6 mx-auto">
                                    <div className="form-group">
                                        <label htmlFor="first_name">First name</label>
                                        <input type="text"
                                            className="form-control"
                                            name="first_name"
                                            placeholder="Enter First Name"
                                            value={this.state.first_name}
                                            onChange={this.onChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="last_name">Last Name</label>
                                        <input type="text"
                                            className="form-control"
                                            name="last_name"
                                            placeholder="Enter Last Name"
                                            value={this.state.last_name}
                                            onChange={this.onChange} />
                                    </div>
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
                                            autoComplete="on"
                                            value={this.state.password}
                                            onChange={this.onChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="role">Role</label>
                                        <input type="text"
                                            className="form-control"
                                            name="role"
                                            placeholder="Enter Role"
                                            value={this.state.role}
                                            onChange={this.onChange} />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="actions d-flex justify-content-around">
                        <button className="btn btn-success" type="submit">
                            Submit
                        </button>
                        <button className="btn btn-secondary" onClick={this.props.closeModal}>
                            Close Modal
                        </button>
                    </div>
                </form>
            </div>
        );
    }
}

export default class Home extends Component {
    constructor(props) {
        super(props);
        
        let deleteUser = this.deleteUser;

        this.user = JSON.parse(localStorage.getItem("user"));
        this.userName = this.user.first_name + " " + this.user.last_name;
        this.dataColumns = [
            {key: '_id', name: 'ID'},
            {key: 'first_name', name: 'First Name', editable: true},
            {key: 'last_name', name: 'Last Name', editable: true},
            {key: 'email', name: 'Email', editable: true},
            {key: 'role', name: 'Role', editable: true},
            {key: 'del', name: 'Delete User', 
                formatter({row}) {

                    return (
                        <span onClick={() => deleteUser(row._id)}>
                            <button type="button" className="close container" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </span>
                    )
                }
            },
        ].map(c => ({ ...c, resizable: true}));
        
        this.state = {
            users: this.props.users
                        .filter(user => user["_id"] !== this.user["_id"]),
            showAdd: false
        }
    }

    deleteUser = userID => {
        this.setState({
            users: this.state.users.filter(user => user["_id"] !== userID)
        });

        let optionsAccess = {
            headers: {
              Authorization: 'Bearer ' + localStorage.getItem("access_token")
            }
        };
        axios.delete("/users/delete_user?id=" + userID, optionsAccess)
            .catch(error => {
                console.log(error)
                if (error.response.data.msg.includes("expir")) {
                    refreshAccess().then(resp => {
                        axios.delete("/users/delete_user", optionsAccess, {id: userID})
                    });
                } else {
                    console.log(error)
                }
            });
    }

    logoutAction = () => {
        let optionsAccess = {
            headers: {
              Authorization: 'Bearer ' + localStorage.getItem("access_token")
            }
        };

        let optionsRefresh = {
            headers: {
              Authorization: 'Bearer ' + localStorage.getItem("refresh_token")
            }
        };
        localStorage.clear();
        axios.delete("/auth/logoutAccess", {}, optionsAccess);
        axios.delete("/auth/logoutRefresh", {}, optionsRefresh);

        this.props.reloadHandler();
    }

    handleRowsUpdate = ({ fromRow, toRow, updated }) => {        
        this.setState(state => {
            const rows = state.users.slice();
            for (let i = fromRow; i <= toRow; i++) {
                rows[i] = { ...rows[i], ...updated };
            }
            return { users: rows };
        });

        let optionsAccess = {
            headers: {
              Authorization: 'Bearer ' + localStorage.getItem("access_token")
            }
        };
        for (let i = fromRow; i <= toRow; i++) {
            axios.post("/users/update_user", {id: this.state.users[i]["_id"], update: updated }, optionsAccess)
                .catch(error => {
                    if (error.response.data.msg.includes("expir")) {
                        refreshAccess().then(resp => {
                            axios.post("/users/update_user", {id: this.state.users[i]["_id"], update: updated }, optionsAccess)
                        });
                      } else {
                        console.log(error)
                      }
                });
        }
    };

    addUser = (e, user) => {
        e.preventDefault();

        user["role"] = user["role"].toLowerCase();
        
        let optionsAccess = {
            headers: {
              Authorization: 'Bearer ' + localStorage.getItem("access_token")
            }
        };

        axios.post("/users/create_user", user, optionsAccess)
            .then(resp => {
                user["_id"] = resp.data["new_id"]
                this.state.users.push(user)
                this.setState({showAdd: false})
            })
            .catch(error => {
                if (error.response.data.msg.includes("expir")) {
                    refreshAccess().then(resp => {
                        axios.post("/users/create_user", user, optionsAccess)
                    });
                  } else {
                    console.log(error)
                  }
            });        
    }

    render() {
        return (
            <>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <a className="navbar-brand" href="#">Welcome {this.userName}</a>
                    <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav mr-auto">
                            <li className="nav-item active">
                                <a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" onClick={this.logoutAction}>Logout</a>
                            </li>
                        </ul>
                        {this.user.role === "admin"
                        ?   (
                            <button className="btn btn-primary" type="button" onClick={() => this.setState({showAdd: true})}>
                                Add User
                            </button>
                            )
                            : <></>
                        }
                    </div>
                </nav>

                <div className="d-flex justify-content-center align-items-center" style={{height: '100%'}}>
                    { this.user.role !== "admin"
                        ? (
                            <div class="alert alert-info" role="alert">
                                <strong>Heads up!</strong> You're just a peasant. You're not worthy of this data.
                            </div>
                        )
                        : (
                            <div className="container">
                                <DataGrid 
                                    columns={this.dataColumns}
                                    rows={this.state.users}
                                    onRowsUpdate={this.handleRowsUpdate}
                                />
                            </div>
                        )
                    }
                </div>
                <Modal show={this.state.showAdd} onSubmit={this.addUser} closeModal={() => this.setState({showAdd: false})} />
            </>
        );
    }
}
