// src/clr1.js

// Utility: split grammar text into rules
export function parseGrammar(text) {
    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(l => l && !l.startsWith("//"));
    let rules = [];
    let nonTerminals = new Set();
    let terminals = new Set();
    for (let line of lines) {
      let [lhs, rhs] = line.split("->").map(s => s.trim());
      if (!lhs || !rhs) throw new Error("Invalid rule: " + line);
      nonTerminals.add(lhs);
      for (let prod of rhs.split("|")) {
        let symbols = prod.trim().split(/\s+/);
        rules.push({ lhs, rhs: symbols });
      }
    }
    // Find terminals
    for (let rule of rules) {
      for (let sym of rule.rhs) {
        if (!nonTerminals.has(sym) && sym !== "ε") terminals.add(sym);
      }
    }
    return {
      rules,
      nonTerminals: Array.from(nonTerminals),
      terminals: Array.from(terminals).filter(t => t !== "ε"),
      start: rules[0].lhs,
    };
  }
  
  // Compute FIRST sets
  function computeFirst(grammar) {
    let first = {};
    for (let nt of grammar.nonTerminals) first[nt] = new Set();
    for (let t of grammar.terminals) first[t] = new Set([t]);
    let changed = true;
    while (changed) {
      changed = false;
      for (let rule of grammar.rules) {
        let lhs = rule.lhs;
        let rhs = rule.rhs;
        let before = first[lhs].size;
        if (rhs[0] === "ε") {
          first[lhs].add("ε");
        } else {
          for (let sym of rhs) {
            for (let f of first[sym]) if (f !== "ε") first[lhs].add(f);
            if (!first[sym].has("ε")) break;
          }
        }
        if (first[lhs].size > before) changed = true;
      }
    }
    return first;
  }
  
  // Compute FOLLOW sets
  function computeFollow(grammar, first) {
    let follow = {};
    for (let nt of grammar.nonTerminals) follow[nt] = new Set();
    follow[grammar.start].add("$");
    let changed = true;
    while (changed) {
      changed = false;
      for (let rule of grammar.rules) {
        let rhs = rule.rhs;
        for (let i = 0; i < rhs.length; ++i) {
          let B = rhs[i];
          if (!grammar.nonTerminals.includes(B)) continue;
          let after = rhs.slice(i + 1);
          let firstAfter = new Set();
          if (after.length === 0) {
            for (let f of follow[rule.lhs]) firstAfter.add(f);
          } else {
            let nullable = true;
            for (let sym of after) {
              for (let f of first[sym]) if (f !== "ε") firstAfter.add(f);
              if (!first[sym].has("ε")) {
                nullable = false;
                break;
              }
            }
            if (nullable) for (let f of follow[rule.lhs]) firstAfter.add(f);
          }
          let before = follow[B].size;
          for (let f of firstAfter) follow[B].add(f);
          if (follow[B].size > before) changed = true;
        }
      }
    }
    return follow;
  }
  
  // LR(1) Item: { rule, dot, lookahead }
  function closure(items, grammar, first) {
    let closureSet = [...items];
    let added = true;
    while (added) {
      added = false;
      for (let item of [...closureSet]) {
        let { rule, dot, lookahead } = item;
        if (dot >= rule.rhs.length) continue;
        let B = rule.rhs[dot];
        if (!grammar.nonTerminals.includes(B)) continue;
        let beta = rule.rhs.slice(dot + 1);
        let la = [];
        if (beta.length === 0) la = [lookahead];
        else {
          let firstBeta = new Set();
          let nullable = true;
          for (let sym of beta) {
            for (let f of first[sym]) if (f !== "ε") firstBeta.add(f);
            if (!first[sym].has("ε")) {
              nullable = false;
              break;
            }
          }
          if (nullable) firstBeta.add(lookahead);
          la = Array.from(firstBeta);
        }
        for (let prod of grammar.rules.filter(r => r.lhs === B)) {
          for (let l of la) {
            let newItem = { rule: prod, dot: 0, lookahead: l };
            if (
              !closureSet.some(
                it =>
                  it.rule === prod &&
                  it.dot === 0 &&
                  it.lookahead === l
              )
            ) {
              closureSet.push(newItem);
              added = true;
            }
          }
        }
      }
    }
    return closureSet;
  }
  
  function goto(items, X, grammar, first) {
    let moved = [];
    for (let item of items) {
      if (item.dot < item.rule.rhs.length && item.rule.rhs[item.dot] === X) {
        moved.push({ rule: item.rule, dot: item.dot + 1, lookahead: item.lookahead });
      }
    }
    return closure(moved, grammar, first);
  }
  
  // Build canonical collection of LR(1) items and parsing table
  export function buildCLR1Table(grammar) {
    // Augment grammar
    let augmented = {
      ...grammar,
      rules: [{ lhs: grammar.start + "'", rhs: [grammar.start] }, ...grammar.rules],
      start: grammar.start + "'",
      nonTerminals: [grammar.start + "'", ...grammar.nonTerminals],
    };
    let first = computeFirst(augmented);
    let C = [];
    let I0 = closure(
      [{ rule: augmented.rules[0], dot: 0, lookahead: "$" }],
      augmented,
      first
    );
    C.push(I0);
    let symbols = [...augmented.terminals, ...augmented.nonTerminals];
    let transitions = {};
    let added = true;
    while (added) {
      added = false;
      for (let i = 0; i < C.length; ++i) {
        for (let X of symbols) {
          let gotoSet = goto(C[i], X, augmented, first);
          if (gotoSet.length === 0) continue;
          let found = C.findIndex(
            s =>
              s.length === gotoSet.length &&
              s.every((it, idx) =>
                it.rule === gotoSet[idx].rule &&
                it.dot === gotoSet[idx].dot &&
                it.lookahead === gotoSet[idx].lookahead
              )
          );
          if (found === -1) {
            C.push(gotoSet);
            transitions[`${i},${X}`] = C.length - 1;
            added = true;
          } else {
            transitions[`${i},${X}`] = found;
          }
        }
      }
    }
    // Build ACTION and GOTO tables
    let action = Array(C.length)
      .fill(0)
      .map(() => ({}));
    let gotoTable = Array(C.length)
      .fill(0)
      .map(() => ({}));
    for (let i = 0; i < C.length; ++i) {
      for (let item of C[i]) {
        let { rule, dot, lookahead } = item;
        if (dot < rule.rhs.length) {
          let a = rule.rhs[dot];
          if (augmented.terminals.includes(a)) {
            let j = transitions[`${i},${a}`];
            if (j !== undefined) action[i][a] = "s" + j;
          }
        } else {
          if (rule.lhs === augmented.start && rule.rhs.length === 1 && rule.rhs[0] === grammar.start && lookahead === "$") {
            action[i]["$"] = "acc";
          } else {
            let prodNum = augmented.rules.findIndex(
              r => r.lhs === rule.lhs && r.rhs.join(" ") === rule.rhs.join(" ")
            );
            if (action[i][lookahead])
              throw new Error("Grammar is not CLR(1) (conflict in table)");
            action[i][lookahead] = "r" + prodNum;
          }
        }
      }
      for (let nt of augmented.nonTerminals) {
        let j = transitions[`${i},${nt}`];
        if (j !== undefined) gotoTable[i][nt] = j;
      }
    }
    return {
      action,
      goto: gotoTable,
      states: C,
      terminals: [...augmented.terminals, "$"],
      nonTerminals: augmented.nonTerminals,
      rules: augmented.rules,
    };
  }
  
  // Parse input string using the table
  export function parseInputString(grammar, table, input) {
    let tokens = input.trim().split(/\s+/).filter(Boolean);
    tokens.push("$");
    let stack = [0];
    let steps = [
      { stack: "0", input: tokens.join(" "), action: "" }
    ];
    let pos = 0;
    while (true) {
      let state = stack[stack.length - 1];
      let a = tokens[pos];
      let act = table.action[state][a];
      if (!act) throw new Error("Parse error at token: " + a);
      if (act === "acc") {
        steps.push({
          stack: stack.join(" "),
          input: tokens.slice(pos).join(" "),
          action: "Accept"
        });
        break;
      } else if (act[0] === "s") {
        stack.push(a);
        stack.push(Number(act.slice(1)));
        pos++;
        steps.push({
          stack: stack.join(" "),
          input: tokens.slice(pos).join(" "),
          action: "Shift"
        });
      } else if (act[0] === "r") {
        let prodIdx = Number(act.slice(1));
        let rule = table.rules[prodIdx];
        let popLen = rule.rhs[0] === "ε" ? 0 : rule.rhs.length * 2;
        let popped = stack.slice(0, stack.length - popLen);
        let state2 = popped[popped.length - 1];
        let gotoState = table.goto[state2][rule.lhs];
        if (gotoState === undefined)
          throw new Error("Goto error for " + rule.lhs);
        stack = [...popped, rule.lhs, gotoState];
        steps.push({
          stack: stack.join(" "),
          input: tokens.slice(pos).join(" "),
          action: `Reduce by ${rule.lhs} -> ${rule.rhs.join(" ")}`
        });
      }
    }
    return { steps };
  }