interface FunctionInfo {
    name: string;
    argCount: number;
    argTypes: string[];
  }

  interface ParseResult {
    functions: FunctionInfo[];
    variables: string[];
  }

  function parseJSX(jsxCode: string): ParseResult {
    const functionPattern = /(?:(?<=\(\)\s*=>|=>\s*)\s*(\w+)\s*\(|(\w+)\s*=\s*\([^)]*\)\s*=>|on\w+={(\w+)})/g;
    const variablePattern = /\{([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)}/g;
    const templateLiteralPattern = /\$\{([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\}/g;
    const arrayAccessPattern = /(\w+)\[(\w+)\]/g;
    const arrayMethodPattern = /(\w+)\.map\(/g;

    const functionsSet: Set<string> = new Set();
    const variables: Set<string> = new Set();

    // Extract functions
    let match;
    while ((match = functionPattern.exec(jsxCode)) !== null) {
      const functionName = match[1] || match[2] || match[3];
      if (functionName) functionsSet.add(functionName);
    }

    // Extract variables
    const extractVariables = (pattern: RegExp) => {
      while ((match = pattern.exec(jsxCode)) !== null) {
        const variable = match[1].split('.')[0]; // Only take the root variable
        if (!functionsSet.has(variable)) {
          variables.add(variable);
        }
      }
    };

    extractVariables(variablePattern);
    extractVariables(templateLiteralPattern);

    // Extract array variables and their indices
    while ((match = arrayAccessPattern.exec(jsxCode)) !== null) {
      const [, arrayVar, indexVar] = match;
      if (!functionsSet.has(arrayVar)) variables.add(arrayVar);
      if (!functionsSet.has(indexVar)) variables.add(indexVar);
    }

    // Extract variables used in array methods
    while ((match = arrayMethodPattern.exec(jsxCode)) !== null) {
      if (!functionsSet.has(match[1])) {
        variables.add(match[1]);
      }
    }

    // Convert functionsSet to FunctionInfo array
    const functions: FunctionInfo[] = Array.from(functionsSet).map(name => {
      const argCount = (jsxCode.match(new RegExp(`${name}\\s*\\(([^)]*)\\)`, 'g')) || [])
        .map(call => call.match(/\(([^)]*)\)/)?.[1].split(',').filter(Boolean).length || 0)
        .reduce((max, current) => Math.max(max, current), 0);
      return { name, argCount, argTypes: Array(argCount).fill('any') };
    });

    return {
      functions,
      variables: Array.from(variables)
    };
  }

  function runTests() {
    const tests = [
      {
        name: "Counter example",
        jsx: `
          <div>
            <h2>Count: {count}</h2>
            <button onClick={() => updateCount(count + 1)}>Increment</button>
            <button onClick={() => updateCount(count - 1)}>Decrement</button>
          </div>
        `,
        expected: {
          functions: [
            { name: 'updateCount', argCount: 1, argTypes: ['any'] }
          ],
          variables: ['count']
        }
      },
      {
        name: "Todo List example",
        jsx: `
          <div>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => updateNewTodo(e.target.value)}
              placeholder="Enter a new todo"
            />
            <button onClick={() => addTodo(newTodo)}>Add Todo</button>
            <ul>
              {todos.map((todo) => (
                <li key={todo.id}>
                  <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                    {todo.text}
                  </span>
                  <button onClick={() => toggleTodo(todo.id)}>Toggle</button>
                  <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </div>
        `,
        expected: {
          functions: [
            { name: 'updateNewTodo', argCount: 1, argTypes: ['any'] },
            { name: 'addTodo', argCount: 1, argTypes: ['any'] },
            { name: 'toggleTodo', argCount: 1, argTypes: ['any'] },
            { name: 'deleteTodo', argCount: 1, argTypes: ['any'] }
          ],
          variables: ['newTodo', 'todos', 'todo']
        }
      },
      {
        name: "Color Picker example",
        jsx: `
          <div>
            <input
              type="color"
              value={color}
              onChange={(e) => updateColor(e.target.value)}
            />
            <div style={{ width: '100px', height: '100px', backgroundColor: color }}></div>
          </div>
        `,
        expected: {
          functions: [
            { name: 'updateColor', argCount: 1, argTypes: ['any'] }
          ],
          variables: ['color']
        }
      },
      {
        name: "Simple Form example",
        jsx: `
          <form onSubmit={submitForm}>
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder="Enter your name"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => updateEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <button type="submit">Submit</button>
          </form>
        `,
        expected: {
          functions: [
            { name: 'submitForm', argCount: 0, argTypes: [] },
            { name: 'updateName', argCount: 1, argTypes: ['any'] },
            { name: 'updateEmail', argCount: 1, argTypes: ['any'] }
          ],
          variables: ['name', 'email']
        }
      },
      {
        name: "Image Gallery example",
        jsx: `
          <div>
            <img src={images[currentIndex]} alt={\`Image \${currentIndex + 1}\`} />
            <button onClick={() => updateIndex((currentIndex - 1 + images.length) % images.length)}>
              Previous
            </button>
            <button onClick={() => updateIndex((currentIndex + 1) % images.length)}>
              Next
            </button>
          </div>
        `,
        expected: {
          functions: [
            { name: 'updateIndex', argCount: 1, argTypes: ['any'] }
          ],
          variables: ['images', 'currentIndex']
        }
      }
    ];

    tests.forEach(test => {
        console.log(`Running test: ${test.name}`);
        const result = parseJSX(test.jsx);

        const isEqual = (a: any, b: any): boolean => {
          if (Array.isArray(a) && Array.isArray(b)) {
            return a.length === b.length &&
                   a.every(item => b.some(bItem => isEqual(item, bItem)));
          }
          if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            return keysA.length === keysB.length &&
                   keysA.every(key => isEqual(a[key], b[key]));
          }
          return JSON.stringify(a) === JSON.stringify(b);
        };

        const out = isEqual(result, test.expected);
        console.log(`Test ${out ? 'PASSED' : 'FAILED'}`);
        if (!out) {
          console.log('Expected:', test.expected);
          console.log('Got:', result);
        }
        console.log('---');
      });
  }

//   runTests();