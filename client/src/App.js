import React, { Component, useState } from "react";
import MindMap from "./components/Canvas/MindMap";
import { OpenVidu } from "openvidu-browser";
import axios from "axios";
import UserVideoComponent from "./components/Audio/UserVideoComponent";

import LoadingBox from "./components/LoadingScreen/LoadingBox";

import "./App.css";
import "./Fonts/Font.css";

const APPLICATION_SERVER_URL =
    process.env.NODE_ENV === "production" ? "" : "https://somethink.online/";

class App extends Component {
    constructor(props) {
        super(props);

        // These properties are in the state's component in order to re-render the HTML whenever their values change
        this.state = {
            mySessionId: undefined,
            myUserName: "User" + Math.floor(Math.random() * 200),
            session: undefined,
            mainStreamManager: undefined,
            publisher: undefined,
            subscribers: [],
            audioEnabled: false,
            speakingUserName: [],
            isLoading: false,
        };

        this.joinSession = this.joinSession.bind(this);
        this.leaveSession = this.leaveSession.bind(this);
        this.toggleAudio = this.toggleAudio.bind(this);
        this.handleChangeSessionId = this.handleChangeSessionId.bind(this);
        this.handleChangeUserName = this.handleChangeUserName.bind(this);
        this.handleMainVideoStream = this.handleMainVideoStream.bind(this);
        this.onbeforeunload = this.onbeforeunload.bind(this);
        this.handleCreateSession = this.handleCreateSession.bind(this);
        this.handleJoinSession = this.handleJoinSession.bind(this);
    }

    componentDidMount() {
        window.addEventListener("beforeunload", this.onbeforeunload);
    }

    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onbeforeunload);
    }

    onbeforeunload(event) {
        this.leaveSession();
    }

    handleChangeSessionId(e) {
        const sessionId = e.target.value.replace(/#/g, "");
        if (sessionId.match(/^[a-zA-Z0-9]+$/)) {
            this.setState({
                mySessionId: sessionId,
            });
        }
    }

    makeid(length) {
        let result = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    handleCreateSession() {
        this.setState({
            mySessionId: this.makeid(8),
        });
        this.joinSession();
    }

    handleJoinSession() {
        const mySessionId = this.state.mySessionId;
        if (mySessionId === undefined || mySessionId === "" || mySessionId === "code") {
            alert("존재하지 않는 방입니다.");
            return;
        }

        this.validateSessionId(mySessionId).then((response) => {
            if (response === true) {
                this.joinSession();
            } else {
                alert("존재하지 않는 방입니다.");
            }
        });
    }

    handleChangeUserName(e) {
        this.setState({
            myUserName: e.target.value,
        });
    }

    handleMainVideoStream(stream) {
        if (this.state.mainStreamManager !== stream) {
            this.setState({
                mainStreamManager: stream,
            });
        }
    }

    deleteSubscriber(streamManager) {
        let subscribers = this.state.subscribers;
        let index = subscribers.indexOf(streamManager, 0);
        if (index > -1) {
            subscribers.splice(index, 1);
            this.setState({
                subscribers: subscribers,
            });
        }
    }

    handleSessionJoin() {
        this.setState({
            sessionJoined: true,
        });

        this.setState({
            isLoading: false,
        });
    }

    handleSpeakingUser(userName) {
        const speakingUserName = this.state.speakingUserName;
        speakingUserName.push(userName);
        this.setState({
            speakingUserName: speakingUserName,
        });
    }

    handleDeleteSpeakingUser(userName) {
        const speakingUserName = this.state.speakingUserName;
        const index = speakingUserName.indexOf(userName);
        if (index > -1) {
            speakingUserName.splice(index, 1);
            this.setState({
                speakingUserName: speakingUserName,
            });
        }
    }

    joinSession() {
        // --- 1) Get an OpenVidu object ---

        this.OV = new OpenVidu();

        this.OV.setAdvancedConfiguration({
            publisherSpeakingEventsOptions: {
                interval: 20,
                threshold: -50,
            },
        });

        // --- 2) Init a session ---
        document.body.style.backgroundColor = "white";
        this.setState(
            {
                session: this.OV.initSession(),
            },
            () => {
                var mySession = this.state.session;

                // --- 3) Specify the actions when events take place in the session ---

                // On every new Stream received...
                mySession.on("streamCreated", (event) => {
                    var subscriber = mySession.subscribe(event.stream, undefined);
                    var subscribers = this.state.subscribers;
                    subscribers.push(subscriber);

                    // Update the state with the new subscribers
                    this.setState({
                        subscribers: subscribers,
                    });
                });

                // On every Stream destroyed...
                mySession.on("streamDestroyed", (event) => {
                    // Remove the stream from 'subscribers' array
                    this.deleteSubscriber(event.stream.streamManager);
                });

                // On every asynchronous exception...
                mySession.on("exception", (exception) => {
                    console.warn(exception);
                });

                mySession.on("publisherStartSpeaking", (event) => {
                    const userName = JSON.parse(event.connection.data).clientData;
                    this.handleSpeakingUser(userName);
                });

                mySession.on("publisherStopSpeaking", (event) => {
                    const userName = JSON.parse(event.connection.data).clientData;
                    this.handleDeleteSpeakingUser(userName);
                });

                // --- 4) Connect to the session with a valid user token ---

                // Get a token from the OpenVidu deployment
                this.getToken().then((token) => {
                    // First param is the token got from the OpenVidu deployment. Second param can be retrieved by every user on event
                    // 'streamCreated' (property Stream.connection.data), and will be appended to DOM as the user's nickname
                    mySession
                        .connect(token, { clientData: this.state.myUserName })
                        .then(async () => {
                            // --- 5) Get your own audio stream ---
                            let publisher = await this.OV.initPublisherAsync(undefined, {
                                audioSource: undefined,
                                videoSource: false,
                                publishAudio: false,
                                publishVideo: false,
                            });

                            // --- 6) Publish your stream ---

                            mySession.publish(publisher);

                            this.setState({
                                mainStreamManager: publisher,
                                publisher: publisher,
                            });
                            this.handleSessionJoin();
                        })
                        .catch((error) => {
                            console.log(
                                "There was an error connecting to the session:",
                                error.code,
                                error.message
                            );
                        });
                });
            }
        );
    }

    leaveSession() {
        // --- 7) Leave the session by calling 'disconnect' method over the Session object ---

        const mySession = this.state.session;
        document.body.style.backgroundColor = "#fbd85d";
        if (mySession) {
            mySession.disconnect();
        }

        const { myUserName, mySessionId } = this.state;
        axios
            .post(APPLICATION_SERVER_URL + "api/leavesession", {
                userName: myUserName,
                sessionId: mySessionId,
            })
            .then(() => {
                console.log("User left the session on the server.");
            })
            .catch((error) => {
                console.error("Error leaving the session on the server:", error);
            });

        window.location.reload();

        // Empty all properties...
        this.OV = null;
        this.setState({
            session: undefined,
            subscribers: [],
            mySessionId: undefined,
            myUserName: "User" + Math.floor(Math.random() * 200),
            mainStreamManager: undefined,
            publisher: undefined,
        });
    }

    toggleAudio() {
        const { publisher, audioEnabled } = this.state;

        if (publisher) {
            publisher.publishAudio(!audioEnabled);

            this.setState({
                audioEnabled: !audioEnabled,
            });
        }
    }

    render() {
        const { isLoading } = this.state;
        const mySessionId = this.state.mySessionId;
        const myUserName = this.state.myUserName;
        const audioEnabled = this.state.audioEnabled;
        return (
            <div className="container">
                {this.state.session === undefined ? (
                    <div id="join">
                        <div className="big-circles" style={{ pointerEvents: "none" }}>
                            <div className="big-circle"></div>
                            <div className="big-circle"></div>
                            <div className="big-circle"></div>
                        </div>
                        <section id="home">
                            <div className="slide-wrapper">
                                <div className="smallcircles" style={{ pointerEvents: "none" }}>
                                    <div className="small-circle"></div>
                                    <div className="small-circle"></div>
                                    <div className="small-circle"></div>
                                    <div className="small-circle"></div>
                                    <div className="small-circle"></div>
                                    <div className="small-circle"></div>
                                </div>
                                <div id="join-dialog" className="jumbotron vertical-center">
                                    <h1 className="logo"></h1>
                                    <form
                                        className="form-group"
                                        onSubmit={this.handleCreateSession}
                                    >
                                        <p>
                                            <label> NAME </label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                id="userName"
                                                value={myUserName}
                                                onChange={this.handleChangeUserName}
                                                required
                                            />
                                        </p>
                                    </form>
                                    <div id="join-dialog-content">
                                        <div className="first">
                                            <p className="create">
                                                <label id="label-create"> NEW ROOM </label>
                                                <input
                                                    onClick={() => {
                                                        this.setState(
                                                            {
                                                                isLoading: true,
                                                            },
                                                            () => {
                                                                this.forceUpdate();
                                                            }
                                                        );
                                                        this.handleCreateSession();
                                                    }}
                                                    className="btn btn-lg btn-success create"
                                                    name="commit"
                                                    type="submit"
                                                    value="CREATE"
                                                />
                                            </p>
                                        </div>
                                        {/* </form> */}
                                        <div>
                                            <form
                                                className="form-group"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    this.handleJoinSession();
                                                }}
                                            >
                                                <p>
                                                    {/* <label> 코드 </label> */}
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        id="sessionId"
                                                        onChange={this.handleChangeSessionId}
                                                        style={{ pointerEvents: "auto" }}
                                                        // pattern="[0-9A-Za-z]+"
                                                        title="영어나 숫자만 입력해주세요"
                                                        placeholder="#INVITE CODE"
                                                    />
                                                </p>
                                                <p className="text-center">
                                                    <input
                                                        onClick={() => {
                                                            this.setState(
                                                                {
                                                                    isLoading: true,
                                                                },
                                                                () => {
                                                                    this.forceUpdate();
                                                                }
                                                            );
                                                            console.log(mySessionId);
                                                        }}
                                                        className="btn btn-lg btn-success"
                                                        name="commit"
                                                        type="submit"
                                                        value="JOIN"
                                                    />
                                                </p>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : null}

                {this.state.session !== undefined ? (
                    <div id="session">
                        <div id="session-header">
                            <MindMap
                                sessionId={mySessionId}
                                leaveSession={this.leaveSession}
                                toggleAudio={this.toggleAudio}
                                audioEnabled={audioEnabled}
                                userName={myUserName}
                                onSessionJoin={this.handleSessionJoin}
                                speakingUserName={this.state.speakingUserName}
                                isLoading={isLoading}
                            />
                        </div>

                        <div id="video-container">
                            {this.state.publisher !== undefined ? (
                                <div>
                                    <UserVideoComponent streamManager={this.state.publisher} />
                                </div>
                            ) : null}
                            {this.state.subscribers.map((sub, i) => (
                                <div>
                                    <UserVideoComponent streamManager={sub} />
                                </div>
                            ))}
                        </div>
                        {isLoading && <LoadingBox roomNumb={mySessionId} />}
                    </div>
                ) : null}
            </div>
        );
    }

    /**
     * --------------------------------------------
     * GETTING A TOKEN FROM YOUR APPLICATION SERVER
     * --------------------------------------------
     * The methods below request the creation of a Session and a Token to
     * your application server. This keeps your OpenVidu deployment secure.
     *
     * In this sample code, there is no user control at all. Anybody could
     * access your application server endpoints! In a real production
     * environment, your application server must identify the user to allow
     * access to the endpoints.
     *
     * Visit https://docs.openvidu.io/en/stable/application-server to learn
     * more about the integration of OpenVidu in your application server.
     */
    async getToken() {
        const sessionId = await this.createSession(this.state.mySessionId);
        console.log("세션 아이디 : " + sessionId);
        return await this.createToken(sessionId);
    }

    async createSession(sessionId) {
        const response = await axios.post(
            APPLICATION_SERVER_URL + "api/sessions",
            { customSessionId: sessionId },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        return response.data; // The sessionId
    }

    async createToken(sessionId) {
        const response = await axios.post(
            APPLICATION_SERVER_URL + "api/sessions/" + sessionId + "/connections",
            {},
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        return response.data; // The token
    }

    async validateSessionId(sessionId) {
        const response = await axios.get(
            APPLICATION_SERVER_URL + "api/sessions/" + sessionId + "/validate",
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        return response.data;
    }
}

// Apply CSS to prevent scrolling
document.body.style.overflow = "hidden";

export default App;
