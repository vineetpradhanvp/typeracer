import React, { useEffect, useState, useRef } from "react";
import socket from "../../socket";

import Details from "../../components/details";
import DisplayText from "../../components/displayText";
import Timer from "../../components/timer";
import Leaderboard from "../../components/leaderBoard";

import styles from "./index.module.css";

export default function Global(props) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(-1);
  const [finished, setFinished] = useState(0);
  const [textArr, setTextArr] = useState([]);
  const [incorrect, setIncorrect] = useState(0);
  const [time, setTime] = useState(0); /* in seconds */
  const [roomId, setRoomId] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [players, setPlayers] = useState([]);
  const intervalRef = useRef(null);
  const [status, setStatus] = useState(0);
  const [list, setList] = useState([]);

  useEffect(() => {
    const func = async () => {
      const res = await fetch("/paragraphs.json");
      const data = await res.json();
      const p = data[roomId % 200];
      setTextArr(p.split(""));
    };
    roomId && func();
  }, [roomId]);
  useEffect(() => {
    if (finished) {
      socket.emit("finished", { roomId, time: new Date().getTime() });
      clearInterval(intervalRef.current);
      setList((prev) => [
        ...prev,
        { id: props.socketId, time: new Date().getTime() },
      ]);
    } else {
      textArr?.length &&
        socket.emit("set-progress", {
          progress: (100 * correct) / textArr.length,
          roomId,
        });
    }
  }, [correct]);
  useEffect(() => {
    socket.emit("add-global");
    socket.on("global-added", ({ id, players }) => {
      setRoomId(id);
      setPlayers(players.map((p) => ({ id: p, progress: 0 })));
      setCountdown(60 - Math.floor((new Date().getTime() - id) / 1000));
      intervalRef.current = setInterval(
        () => setCountdown((prev) => prev - 1),
        1000
      );
    });
    socket.on("set-progress", (obj) => {
      setPlayers((prev) =>
        prev.map((p) =>
          obj.player === p.id ? { ...p, progress: obj.progress } : p
        )
      );
    });
    socket.on("finished", ({ id, time }) => {
      setPlayers((prev) =>
        prev.map((p) => (id === p.id ? { ...p, progress: 100 } : p))
      );
      setList((prev) =>
        [...prev, { time, id }].sort((a, b) => a.time - b.time)
      );
    });
    socket.on("global-padded", (id) => {
      setPlayers((prev) => [...prev, { id, progress: 0 }]);
    });
    socket.on("global-premoved", (id) => {
      setPlayers((prev) => prev.filter((x) => x.id !== id));
    });

    return () => {
      socket.emit("leave-global");
      socket.removeAllListeners("global-added");
      socket.removeAllListeners("global-padded");
      socket.removeAllListeners("global-premoved");
      clearInterval(intervalRef.current);
    };
  }, []);
  useEffect(() => {
    if (countdown === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      setStatus((_prev) => 1);
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
  }, [countdown]);

  return (
    <main className={styles.main}>
      <div className={styles.column}>
        <Leaderboard list={list} socketId={props.socketId} />
        <Details
          finished={finished}
          textLength={textArr.length}
          incorrect={incorrect}
          time={time}
        />
      </div>
      <div className={`${styles.column} card`}>
        {textArr.length && status ? (
          <DisplayText
            textArr={textArr}
            index={index}
            setIndex={setIndex}
            correct={correct}
            setCorrect={setCorrect}
            finished={finished}
            setFinished={setFinished}
            incorrect={incorrect}
            setIncorrect={setIncorrect}
          />
        ) : null}
        {countdown ? (
          <span className={styles.countdown}>
            Race starts in : 00:
            {countdown < 10 ? `0${countdown % 60}` : countdown}
          </span>
        ) : (
          <span className={styles.countdown}>Race Started</span>
        )}
      </div>
      <div className={styles.column}>
        <Timer
          time={time}
          correct={correct + 1}
          total={textArr?.length}
          players={players}
          socketId={props.socketId}
          finished={finished}
        />
      </div>
    </main>
  );
}
