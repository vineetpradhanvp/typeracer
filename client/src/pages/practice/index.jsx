import React, { useEffect, useState } from "react";

import Details from "../../components/details";
import DisplayText from "../../components/displayText";
import Timer from "../../components/timer";

import styles from "./index.module.css";

export default function Practice() {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(-1);
  const [finished, setFinished] = useState(0);
  const [textArr, setTextArr] = useState([]);
  const [incorrect, setIncorrect] = useState(0);
  const [time, setTime] = useState(0); /* in seconds */

  useEffect(() => {
    const func = async () => {
      const res = await fetch("/paragraphs.json");
      const data = await res.json();
      const p = data[Math.floor(Math.random() * 200)];
      setTextArr(p.split(""));
    };
    !textArr.length && func();
  }, [textArr.length]);

  const restartHandler = (e) => {
    setIndex(0);
    setCorrect(-1);
    setIncorrect(0);
    setFinished(0);
    setTextArr([]);
    setTime(0);
    e.target.blur();
  };

  return (
    <main className={styles.main}>
      <div className={styles.column}>
        <Details
          finished={finished}
          textLength={textArr.length}
          incorrect={incorrect}
          time={time}
        />
      </div>
      <div className={`${styles.column} card`}>
        {textArr.length ? (
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
        <button className={styles.restartBtn} onClick={restartHandler}>
          Reset
        </button>
      </div>
      <div className={styles.column}>
        <div className={`card ${styles.timer}`}>
          {textArr.length ? (
            <Timer
              correct={correct + 1}
              total={textArr?.length}
              finished={finished}
              index={index}
              time={time}
              setTime={setTime}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
