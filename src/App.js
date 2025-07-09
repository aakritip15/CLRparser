import React, { useState } from "react";
import "./App.css";
import { parseGrammar, buildCLR1Table, parseInputString } from "./clr1";
import mermaid from "mermaid";
import { useRef, useEffect } from "react";

const CLR_RULES = [
  "The CLR parser stands for canonical LR parser.It is a more powerful LR parser.It makes use of lookahead symbols.",

  "The general syntax becomes  [A->∝.B, a ] where A->∝.B is the production and a is a terminal or right end marker $ LR(1) items=LR(0) items + look ahead",

`Let's apply the rule of lookahead to the above productions

  1. The initial look ahead is always $,

  2. Now, the 1st production came into existence because of ' . ' Before 'S' in 0th production.There is nothing after 'S', so the lookahead of 0th production will be the lookahead of 1st production. ie:  S-->.AA ,$,

  3. Now, the 2nd production came into existence because of ' . ' Before 'A' in the 1st production.After 'A', there's  'A'. So, FIRST(A) is a,bTherefore,the look ahead for the 2nd production becomes a|b.,

  4. Now, the 3rd production is a part of the 2nd production.So, the look ahead will be the same.`
];

function escapeMermaidLabel(label) {
  return label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\*/g, "#42;"); // Escape *
}

function getMermaidGraph(table) {
  // Build a Mermaid graph for state transitions
  let lines = ["graph TD"];
  table.states.forEach((_, i) => {
    table.terminals.concat(table.nonTerminals).forEach(sym => {
      const j = table.goto[i][sym] ?? (table.action[i][sym]?.startsWith("s") ? Number(table.action[i][sym].slice(1)) : undefined);
      if (j !== undefined) {
        lines.push(`  I${i} -- "${escapeMermaidLabel(sym)}" --> I${j}`);
      }
    });
  });
  return lines.join("\n");
}

// Alternative MermaidDiagram component with fallback
function MermaidDiagram({ chart }) {
  const ref = useRef();
  
  useEffect(() => {
    const renderDiagram = async () => {
      if (ref.current && chart) {
        try {
          // Clear previous content
          ref.current.innerHTML = '';
          
          // Initialize mermaid
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });
          
          // Generate unique ID
          const id = `diagram-${Date.now()}`;
          
          // Try modern API first
          try {
            const { svg } = await mermaid.render(id, chart);
            ref.current.innerHTML = svg;
          } catch (renderError) {
            // Fallback to older API if modern one fails
            console.log('Modern API failed, trying fallback...', renderError);
            
            // Create element directly in our container
            const diagramDiv = document.createElement('div');
            diagramDiv.className = 'mermaid';
            diagramDiv.textContent = chart;
            ref.current.appendChild(diagramDiv);
            
            // Use callback-based render
            mermaid.render(id, chart, (svgCode) => {
              ref.current.innerHTML = svgCode;
            });
          }
          
        } catch (error) {
          console.error('All Mermaid rendering methods failed:', error);
          
          // Show a simple text-based representation as fallback
          const lines = chart.split('\n');
          const transitions = lines.slice(1).map(line => {
            const match = line.match(/I(\d+) -- "([^"]*)" --> I(\d+)/);
            if (match) {
              return `State ${match[1]} → "${match[2]}" → State ${match[3]}`;
            }
            return line;
          });
          
          ref.current.innerHTML = `
            <div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px;">
              <h4>State Transition Diagram</h4>
              <p><em>Visual diagram failed to render. Here's the text representation:</em></p>
              <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
                ${transitions.map(t => `<li>${t}</li>`).join('')}
              </ul>
              <details style="margin-top: 15px;">
                <summary>Show Mermaid code</summary>
                <pre style="background: #f5f5f5; padding: 10px; margin-top: 10px; text-align: left;">${chart}</pre>
              </details>
            </div>
          `;
        }
      }
    };
    
    renderDiagram();
  }, [chart]);
  
  return <div ref={ref} style={{ width: '100%', textAlign: 'center' }} />;
}

export default function App() {
  const [grammarText, setGrammarText] = useState(
    "S -> L = R\nS -> R\nL -> * R\nL -> id\nR -> L"
  );
  const [inputString, setInputString] = useState("id = * id");
  const [table, setTable] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");
  const [showStates, setShowStates] = useState(true);

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
      <div className="rules-card">
        <h2>CLR(1) Grammar Rules</h2>
        <ul>
        {CLR_RULES.map((rule, i) => (
          <li key={i}>
            {rule.split('\n').map((line, j) => (
              <div key={j}>{line}</div>
            ))}
          </li>
        ))}

        </ul>
      </div>
      <div className="section card">
        <h2>1. Enter Grammar</h2>
        <textarea
          value={grammarText}
          onChange={e => setGrammarText(e.target.value)}
          rows={6}
        />
        <button onClick={handleParseGrammar}>Build CLR(1) Table</button>
      </div>

      {table && (
        <div className="section card">
          <h2>2. CLR(1) Parsing Table</h2>
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
        <div className="section card">
          <h2>
            3. LR(1) Item Sets & Diagram
            <button
              className="toggle-btn"
              onClick={() => setShowStates(s => !s)}
              style={{ marginLeft: 16 }}
            >
              {showStates ? "Show Diagram" : "Show Item Sets"}
            </button>
          </h2>
          {showStates ? (
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
          ) : (
            <div className="diagram-block">
              <MermaidDiagram chart={getMermaidGraph(table)} />
            </div>
          )}
        </div>
      )}
      {table && (
        <div className="section card">
          <h2>4. Parse Input String</h2>
          <input
            value={inputString}
            onChange={e => setInputString(e.target.value)}
            style={{ width: "60%" }}
          />
          <button onClick={handleParseString}>Parse</button>
          {error && <div className="error card">{error}</div>}
        </div>
      )}
      {steps.length > 0 && (
        <div className="section card">
          <h2>5. Parsing Steps</h2>
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
      
      </footer>
    </div>
  );
}