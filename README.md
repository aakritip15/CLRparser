# CLR(1) Parser Demo

A comprehensive web-based tool for visualizing and understanding CLR(1) parsing, built with React. This interactive demo helps students and developers learn how CLR(1) parsers work by providing step-by-step parsing visualization and state machine diagrams.

## Features

- **Interactive Grammar Input**: Enter context-free grammars using an intuitive syntax
- **Automatic CLR(1) Table Generation**: Builds complete parsing tables with action and goto functions
- **State Machine Visualization**: View LR(1) item sets and state transition diagrams
- **Step-by-Step Parsing**: Trace through the parsing process with detailed stack and input states
- **Error Handling**: Clear error messages for invalid grammars or parsing conflicts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Demo

![CLR(1) Parser Demo](https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=CLR(1)+Parser+Demo)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clr1-parser-demo.git
cd clr1-parser-demo
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Grammar Input

Enter your context-free grammar following these rules:

- **Rule Format**: `Non-terminal -> Production` (e.g., `S -> NP VP`)
- **Multiple Alternatives**: Use `|` to separate alternatives (e.g., `Det -> the | a`)
- **Multiple Tokens**: Separate tokens with spaces (e.g., `NP -> Det Noun`)
- **Empty Productions**: Use `ε` (epsilon) for empty productions (e.g., `NP -> Det | ε`)
- **Terminals**: Use lowercase or mixed case (e.g., `id`, `num`, `while`)
- **Non-terminals**: Use uppercase letters (e.g., `S`, `NP`, `VP`)

### 2. Example Grammar

```
S -> L = R
S -> R
L -> * R
L -> id
R -> L
```

### 3. Parsing Input

After building the CLR(1) table, you can parse input strings like:
- `id = * id`
- `* id = id`
- `id`

## Grammar Rules Reference

| Rule | Description | Example |
|------|-------------|---------|
| Basic Rule | Non-terminal -> Production | `S -> NP VP` |
| Alternatives | Use `\|` for multiple productions | `Det -> the \| a` |
| Multiple Tokens | Separate with spaces | `NP -> Det Noun` |
| Empty Production | Use `ε` (epsilon) | `NP -> Det \| ε` |
| Terminals | Lowercase/mixed case identifiers | `id`, `num`, `while` |
| Non-terminals | Uppercase letters | `S`, `NP`, `VP` |

## Project Structure

```
src/
├── App.js              # Main React component
├── App.css             # Styling
├── clr1.js             # CLR(1) parsing algorithm implementation
├── index.js            # React entry point 
```

## Algorithm Details

### CLR(1) Parser Construction

The CLR(1) parser construction follows these steps:

1. **Augment Grammar**: Add new start symbol S' -> S
2. **Build LR(1) Items**: Create items with lookahead symbols
3. **Construct Item Sets**: Build canonical collection of LR(1) item sets
4. **Build Action Table**: 
   - Shift actions for transitions on terminals
   - Reduce actions for complete items
   - Accept action for augmented start item
5. **Build Goto Table**: Transitions on non-terminals

### Parsing Process

1. **Initialize**: Start with state 0 and input string
2. **Lookup Action**: Use current state and input symbol
3. **Execute Action**:
   - **Shift**: Push state and advance input
   - **Reduce**: Pop states, apply production, push new state
   - **Accept**: Parsing successful
   - **Error**: Parsing failed

## Dependencies

- **React**: Frontend framework
- **Mermaid**: Diagram generation for state visualizations
- **CSS**: Custom styling for tables and layout

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
 

## Educational Use

This tool is perfect for:

- **Compiler Design Courses**: Understanding parser construction
- **Computer Science Students**: Learning formal language theory
- **Developers**: Debugging parsing issues in custom languages
- **Educators**: Teaching parsing algorithms with visual aids

## Common Grammar Examples

### Expression Grammar
```
E -> E + T
E -> T
T -> T * F
T -> F
F -> ( E )
F -> id
```

### Statement Grammar
```
S -> if E then S else S
S -> while E do S
S -> id = E
E -> E + E
E -> E * E
E -> id
E -> num
```

### Arithmetic Grammar
```
S -> E
E -> E + T
E -> T
T -> T * F
T -> F
F -> ( E )
F -> id
```

## Troubleshooting

### Common Issues

1. **Grammar Conflicts**: If you encounter shift/reduce or reduce/reduce conflicts, your grammar may not be CLR(1). Consider refactoring.

2. **Parsing Errors**: Check that your input string uses only terminals defined in your grammar.

3. **Diagram Not Rendering**: The Mermaid diagram requires a modern browser. If it fails, the tool will show a text-based representation.

<!-- ### Error Messages

- **"Invalid grammar syntax"**: Check rule format and syntax
- **"Shift/Reduce conflict"**: Grammar is not CLR(1) compatible
- **"Reduce/Reduce conflict"**: Multiple reductions possible at same state
- **"Unexpected token"**: Input contains undefined terminals -->

 
 

**Happy Parsing!** 