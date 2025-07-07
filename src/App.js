import React, { useState } from "react";
import "./App.css";
import { parseGrammar, buildCLR1Table, parseInputString } from "./clr1";

export default function App() {
  const [grammarText, setGrammarText] = useState(
    "S -> L = R\nS -> R\nL -> * R\nL -> id\nR -> L"
  );
  const [inputString, setInputString] = useState("id = * id");
  const [table, setTable] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");

  function handleParseGrammar() {
    setError("");
    try {
      const grammar = parseGrammar(grammarText);
      const clr1 = buildCLR1Table(grammar);
      setTable(clr1);
      setSteps([]);
    } catch (e) {
      setError(e.message);
      setTable(null);
      setSteps([]);
    }
  }

  function handleParseString() {
    setError("");
    try {
      const grammar = parseGrammar(grammarText);
      const clr1 = buildCLR1Table(grammar);
      const result = parseInputString(grammar, clr1, inputString);
      setSteps(result.steps);
    } catch (e) {
      setError(e.message);
      setSteps([]);
    }
  }

  return (
    <div className="container">
      <h1>CLR(1) Parser Demo</h1>
      <div className="section">
        <h2>1. Enter Grammar</h2>
        <textarea
          value={grammarText}
          onChange={e => setGrammarText(e.target.value)}
          rows={6}
        />
        <button onClick={handleParseGrammar}>Build CLR(1) Table</button>
      </div>
      {error && <div className="error">{error}</div>}
      {table && (
        <div className="section">
          <h2>2. CLR(1) Parsing Table</h2>
          {table && (
  <div className="section">
    <h2>3. LR(1) Item Sets (States)</h2>
    <div className="states-list">
      {table.states.map((items, idx) => (
        <div key={idx} className="state-block">
          <strong>I{idx}:</strong>
          <ul>
            {items.map((item, j) => (
              <li key={j}>
                {item.rule.lhs} →{" "}
                {item.rule.rhs
                  .map((sym, k) =>
                    k === item.dot ? (
                      <b key={k}>• {sym} </b>
                    ) : (
                      <span key={k}>{sym} </span>
                    )
                  )}
                {item.dot === item.rule.rhs.length ? <b>•</b> : null}
                , <span style={{ color: "#0077cc" }}>{item.lookahead}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
)}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>State</th>
                  {table.terminals.map(t => (
                    <th key={t}>Action({t})</th>
                  ))}
                  {table.nonTerminals.map(nt => (
                    <th key={nt}>Goto({nt})</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.states.map((_, i) => (
                  <tr key={i}>
                    <td>{i}</td>
                    {table.terminals.map(t => (
                      <td key={t}>
                        {table.action[i][t] || ""}
                      </td>
                    ))}
                    {table.nonTerminals.map(nt => (
                      <td key={nt}>
                        {table.goto[i][nt] !== undefined
                          ? table.goto[i][nt]
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {table && (
        <div className="section">
          <h2>3. Parse Input String</h2>
          <input
            value={inputString}
            onChange={e => setInputString(e.target.value)}
            style={{ width: "60%" }}
          />
          <button onClick={handleParseString}>Parse</button>
        </div>
      )}
      {steps.length > 0 && (
        <div className="section">
          <h2>4. Parsing Steps</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Stack</th>
                  <th>Input</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step, i) => (
                  <tr key={i}>
                    <td>{step.stack}</td>
                    <td>{step.input}</td>
                    <td>{step.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <footer>
        <p>
          Inspired by <a href="https://clr-parser.vercel.app/" target="_blank" rel="noopener noreferrer">clr-parser.vercel.app</a>
        </p>
      </footer>
    </div>
  );
}