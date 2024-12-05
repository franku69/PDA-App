import React, { useState } from "react";
import "./App.css";
import { Stage, Layer, Circle, Arrow, Text } from "react-konva";

const App = () => {
  const [languageDefinition, setLanguageDefinition] = useState("");
  const [inputString, setInputString] = useState("");
  const [result, setResult] = useState("");
  const [transitions, setTransitions] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const parseLanguageDefinition = (definition) => {
    const rules = definition.split("\n").map((line) => line.trim());
    const transitions = [];

    for (let rule of rules) {
      const match = rule.match(/\((.+),(.+),(.+)\) -> \((.+),(.+)\)/);
      if (!match) {
        throw new Error(
          "Invalid rule format. Use (state, input, stackTop) -> (newState, newStackTop)"
        );
      }
      const [_, state, input, stackTop, newState, newStackTop] = match;
      transitions.push({
        state: state.trim(),
        input: input.trim(),
        stackTop: stackTop.trim(),
        newState: newState.trim(),
        newStackTop: newStackTop.trim(),
      });
    }
    return transitions;
  };

  const simulatePDA = (input, transitions) => {
    let stack = ["Z"];
    let currentState = "q0";

    for (let char of input) {
      let transitionFound = false;

      for (let { state, input, stackTop, newState, newStackTop } of transitions) {
        if (
          state === currentState &&
          (input === char || input === "ε") &&
          stack[stack.length - 1] === stackTop
        ) {
          stack.pop();
          if (newStackTop !== "ε") {
            stack.push(...newStackTop.split("").reverse());
          }
          currentState = newState;
          transitionFound = true;
          break;
        }
      }

      if (!transitionFound) {
        return false;
      }
    }

    const finalTransition = transitions.find(
      ({ state, input, stackTop, newState, newStackTop }) =>
        state === currentState &&
        input === "ε" &&
        stackTop === "Z" &&
        newStackTop === "ε"
    );

    return finalTransition !== undefined;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      const transitions = parseLanguageDefinition(languageDefinition);
      setTransitions(transitions);
      setSubmitted(true);
      const isAccepted = simulatePDA(inputString, transitions);

      setResult(
        `The string "${inputString}" is ${
          isAccepted ? "ACCEPTED" : "REJECTED"
        } by the PDA.`
      );
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const generateAutomatonDiagram = () => {
    const stateCoordinates = {
      q0: { x: 100, y: 100 },
      q1: { x: 350, y: 200 },
      q2: { x: 600, y: 100 },
      qf: { x: 800, y: 200 },
    };

    return (
      <Layer>
        {transitions.map(
          ({ state, input, stackTop, newState, newStackTop }, index) => {
            const from = stateCoordinates[state];
            const to = stateCoordinates[newState];
            const isSelfLoop = state === newState;
            const arrowPoints = isSelfLoop
              ? [from.x, from.y - 30, from.x, from.y - 60, from.x + 20, from.y - 45] // Create loop arrow
              : [from.x, from.y, to.x, to.y]; // Regular transition arrow

            return (
              <React.Fragment key={index}>
                <Arrow
                  points={arrowPoints}
                  pointerLength={12} // Set the pointer length to match both arrows
                  pointerWidth={12} // Set the pointer width to match both arrows
                  fill="black"
                  stroke="black"
                  strokeWidth={2}
                />
                <Text
                  x={(from.x + to.x) / 2 + (isSelfLoop ? 30 : 0)} // Adjust text position for self-loop
                  y={(from.y + to.y) / 2 - (isSelfLoop ? 40 : 10)} // Adjust text position for self-loop
                  text={`${input}, ${stackTop} -> ${newStackTop}`}
                  fontSize={14}
                  fontFamily="Arial"
                  fill="black"
                  width={120} // Added width to prevent overlap with arrows
                  align="center" // Center-align text
                />
              </React.Fragment>
            );
          }
        )}

        {Object.keys(stateCoordinates).map((state, index) => {
          const { x, y } = stateCoordinates[state];
          return (
            <Circle
              key={index}
              x={x}
              y={y}
              radius={30}
              fill="lightblue"
              stroke="black"
              strokeWidth={2}
            />
          );
        })}

        {Object.keys(stateCoordinates).map((state, index) => {
          const { x, y } = stateCoordinates[state];
          return (
            <Text
              key={index}
              x={x - 15}
              y={y - 10}
              text={state}
              fontSize={16}
              fontFamily="Arial"
              fill="black"
            />
          );
        })}
      </Layer>
    );
  };

  return (
    <div className="App">
      <h1>Pushdown Automaton Validator</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Define PDA transitions (one per line):
          <textarea
            rows="5"
            cols="50"
            value={languageDefinition}
            onChange={(e) => setLanguageDefinition(e.target.value)}
            placeholder="e.g., (q0,a,Z) -> (q0,AZ)\n(q0,b,A) -> (q1,ε)"
          />
        </label>
        <br />
        <label>
          Enter a string to test:
          <input
            type="text"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            placeholder="e.g., aabb, ab"
          />
        </label>
        <br />
        <button type="submit">Check</button>
      </form>
      {result && <p className="result">{result}</p>}

      {submitted && (
        <Stage width={window.innerWidth} height={500}>
          {generateAutomatonDiagram()}
        </Stage>
      )}
    </div>
  );
};

export default App;
