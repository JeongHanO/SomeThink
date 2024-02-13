import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

import { OpenVidu } from "openvidu-browser";
import axios from "axios";

import HomePage from "./components/Page/HomePage";
import SessionPage from "./components/Page/SessionPage";
import LoginPage from "./components/Page/LoginPage";

import "./App.css";
import "./Fonts/Font.css";

const APPLICATION_SERVER_URL =
    process.env.NODE_ENV === "production" ? "" : "https://somethink.online/";

const App = () => {
    const [appState, setAppState] = useState({
        mySessionId: undefined,
        myUserName: "User" + Math.floor(Math.random() * 200),
        session: undefined,
        mainStreamManager: undefined,
        publisher: undefined,
        subscribers: [],
        audioEnabled: false,
        speakingUserName: [],
        isLoading: false,
    });

    useEffect(() => {
        const storedSessionId = sessionStorage.getItem("sessionId");
        const storedUserName = sessionStorage.getItem("userName");
        if (storedSessionId) {
            setAppState({
                ...appState,
                mySessionId: storedSessionId,
                myUserName: storedUserName,
            });
        } else {
            // window.location.href = "/";
            // this.handleCreateSession();
        }

        return () => {
            window.removeEventListener("beforeunload", onbeforeunload);
        };
    }, []);

    useEffect(() => {
        if (appState.session) {
            if (appState.mySessionId !== undefined) {
                joinSession();
            }
        }
    }, [appState]);

    const handleChangeSessionId = (e) => {
        const sessionId = e.target.value.replace(/#/g, "");
        if (sessionId.match(/^[a-zA-Z0-9]+$/)) {
            setAppState({ ...appState, mySessionId: sessionId });
        }
    };

    const makeid = (length) => {
        let result = "";
        let counter = 0;
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
            counter++;
        }
        return result;
    };

    const handleCreateSession = () => {
        setAppState({ ...appState, mySessionId: makeid(8) });
    };

    const handleJoinSession = (callback) => {
        const mySessionId = appState.mySessionId;
        if (mySessionId === undefined || mySessionId === "") {
            alert("존재하지 않는 방입니다.");
            callback(false);
        } else {
            validateSessionId(mySessionId).then((response) => {
                if (response === true) {
                    joinSession();
                    callback(true);
                } else {
                    alert("존재하지 않는 방입니다.");
                    callback(false);
                }
            });
        }
    };

    const handleChangeUserName = (e) => {
        setAppState({ ...appState, myUserName: e.target.value });
    };

    const handleMainVideoStream = (stream) => {
        if (appState.mainStreamManager !== stream) {
            setAppState({ ...appState, mainStreamManager: stream });
        }
    };

    const deleteSubscriber = (streamManager) => {
        // TODO: const로 선언해도 문제없는 지 테스트
        let subscribers = appState.subscribers;
        let index = subscribers.indexOf(streamManager, 0);
        if (index > -1) {
            subscribers.splice(index, 1);
            setAppState({ ...appState, subscribers: subscribers });
        }
    };

    const handleSessionJoin = () => {
        setAppState({ ...appState, isLoading: true });
        setAppState({ ...appState, isLoading: false });
    };

    const handleSpeakingUser = (userName) => {
        const speakingUserName = appState.speakingUserName;
        speakingUserName.push(userName);
        setAppState({ ...appState, speakingUserName: speakingUserName });
    };

    const handleDeleteSpeakingUser = (userName) => {
        const speakingUserName = appState.speakingUserName;
        const index = speakingUserName.indexOf(userName);
        if (index > -1) {
            speakingUserName.splice(index, 1);
            setAppState({ ...appState, speakingUserName: speakingUserName });
        }
    };

    const joinSession = () => {
        const OV = new OpenVidu();

        OV.setAdvancedConfiguration({
            publisherSpeakingEventsOptions: {
                interval: 20,
                threshold: -50,
            },
        });

        setAppState((prevState) => {
            const mySession = OV.initSession();

            mySession.on("streamCreated", (event) => {
                let subscriber = mySession.subscribe(event.stream, undefined);
                let subscribers = appState.subscribers;
                subscribers.push(subscriber);

                setAppState({ ...appState, subscribers: subscribers });
            });

            mySession.on("streamDestroyed", (event) => {
                deleteSubscriber(event.stream.streamManager);
            });

            mySession.on("exception", (exception) => {
                console.warn(exception);
            });

            mySession.on("publisherStartSpeaking", (event) => {
                const userName = JSON.parse(event.connection.data).clientData;
                handleSpeakingUser(userName);
            });

            mySession.on("publisherStopSpeaking", (event) => {
                const userName = JSON.parse(event.connection.data).clientData;
                handleDeleteSpeakingUser(userName);
            });

            getToken().then((token) => {
                mySession
                    .connect(token, { clientData: appState.myUserName })
                    .then(async () => {
                        let publisher = OV.initPublisher(undefined, {
                            audioSource: undefined,
                            videoSource: false,
                            publishAudio: false,
                            publishVideo: false,
                        });

                        mySession.publish(publisher);

                        setAppState({
                            ...appState,
                            mainStreamManager: publisher,
                            publisher: publisher,
                        });
                        sessionStorage.setItem("sessionId", appState.mySessionId);
                        sessionStorage.setItem("userName", appState.myUserName);
                        handleSessionJoin();
                    })
                    .catch((error) => {
                        console.log(
                            "There was an error connecting to the session:",
                            error.code,
                            error.message
                        );
                    });
            });

            return { ...prevState, session: mySession };
        });
    };

    const leaveSession = () => {
        sessionStorage.removeItem("sessionId");
        sessionStorage.removeItem("userName");
        const mySession = appState.session;
        if (mySession) {
            mySession.disconnect();
        }

        const { myUserName, mySessionId } = appState;
        axios
            .post(APPLICATION_SERVER_URL + "api/leave", {
                userName: myUserName,
                sessionId: mySessionId,
            })
            .then(() => {
                console.log("User left the session on the server.");
            })
            .catch((error) => {
                console.error("Error leaving the session on the server:", error);
            });

        setAppState({
            session: undefined,
            subscribers: [],
            mySessionId: undefined,
            myUserName: "User" + Math.floor(Math.random() * 200),
            mainStreamManager: undefined,
            publisher: undefined,
        });

        window.location.href = "/";
    };

    const toggleAudio = () => {
        const { publisher, audioEnabled } = appState;

        if (publisher) {
            publisher.publishAudio(!audioEnabled);

            setAppState({ ...appState, audioEnabled: !audioEnabled });
        }
    };

    const getToken = async () => {
        const sessionId = await createSession(appState.mySessionId);
        return await createToken(sessionId);
    };

    const createSession = async (sessionId) => {
        const response = await axios.post(
            APPLICATION_SERVER_URL + "api/sessions",
            {
                customSessionId: sessionId,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    };

    const createToken = async (sessionId) => {
        const response = await axios.post(
            APPLICATION_SERVER_URL + "api/sessions/" + sessionId + "/connections",
            {},
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    };

    const validateSessionId = async (sessionId) => {
        const response = await axios.get(
            APPLICATION_SERVER_URL + "api/sessions/" + sessionId + "/validate",
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    };

    return (
        <Router>
            <Routes>
                <Route
                    exact
                    path="/"
                    element={
                        <HomePage
                            myUserName={appState.myUserName}
                            handleChangeUserName={handleChangeUserName}
                            handleCreateSession={handleCreateSession}
                            handleJoinSession={handleJoinSession}
                            isLoading={appState.isLoading}
                            mySessionId={appState.mySessionId}
                            handleChangeSessionId={handleChangeSessionId}
                        />
                    }
                />
                <Route
                    exact
                    path="/session"
                    element={
                        <SessionPage
                            session={appState.session}
                            mySessionId={appState.mySessionId}
                            myUserName={appState.myUserName}
                            audioEnabled={appState.audioEnabled}
                            handleMainVideoStream={handleMainVideoStream}
                            subscribers={appState.subscribers}
                            publisher={appState.publisher}
                            leaveSession={leaveSession}
                            toggleAudio={toggleAudio}
                            speakingUserName={appState.speakingUserName}
                            isLoading={appState.isLoading}
                            handleSessionJoin={handleSessionJoin}
                        />
                    }
                />
                <Route exact path="login" element={<LoginPage />} />
            </Routes>
        </Router>
    );
};

document.body.style.overflow = "hidden";

export default App;
