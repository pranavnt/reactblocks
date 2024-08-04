// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import toolbox from '@/blocks/toolbox';
import { javascriptGenerator } from 'blockly/javascript';
import { LiveProvider, LiveEditor, LivePreview } from 'react-live';
Blockly.setLocale(En);

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function Home() {
  const [showCode, setShowCode] = useState(true);
  const [code, setCode] = useState(``);
  const [componentNames, setComponentNames] = useState([]);

  // on cmd + enter, run the code
  useEffect(() => {
    const workspace = Blockly.getMainWorkspace();
    const onCmdEnter = (e) => {
      if (e.keyCode === 13) {
        let code = javascriptGenerator.workspaceToCode(workspace);

        const componentRegex =
          /function\s+(?<functionName>[a-zA-Z_]\w*)\s*\(\)\s*\{[\s\S]*?\}/gm;
        let match;
        const componentNames = [];
        while ((match = componentRegex.exec(code)) !== null) {
          componentNames.push(match.groups.functionName);
        }

        const stateRegex = /^\s*(?<left>\w+)\s*=\s*(?<right>\d+)\s*;\s*$/m;

        const stateNames = [];
        const lines = code.split('\n');
        lines.forEach((line, index) => {
          const match = line.match(stateRegex);
          if (match) {
            const left = match.groups.left;
            stateNames.push(left);
            lines[index] = line.replace(
              line,
              `let [${left}, set${capitalize(left)}] = React.useState(${
                match.groups.right
              });`
            );
          }
        });

        code = lines.join('\n');

        code = `import React from 'react';\n${code}`;


        for (const stateName of stateNames) {
          code = code.replace(`var ${stateName};`)
        }

        setComponentNames(componentNames);
        setCode(lines.join('\n'));
      }
    };
    document.addEventListener('keyup', onCmdEnter);
    return () => document.removeEventListener('keyup', onCmdEnter);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const blocklyDiv = document.getElementById('blocklyDiv');

      // Only initialize Blockly if the div exists and it hasn't been initialized yet
      if (blocklyDiv && blocklyDiv.children.length === 0) {
        const workspace = Blockly.inject(blocklyDiv, {
          toolbox: toolbox,
        });

        // Resize Blockly when the window is resized
        const onResize = () => Blockly.svgResize(workspace);
        window.addEventListener('resize', onResize);

        // Return a cleanup function to remove the resize listener
        return () => window.removeEventListener('resize', onResize);
      }
    }
  }, []);

  return (
    <>
      <div id="blocklyDiv" style={{ height: '100vh', width: '100%' }}></div>
      <LiveProvider
        code={code}
        style={{
          height: '100vh',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <LiveEditor className="font-mono" />
        <LivePreview />
      </LiveProvider>
    </>
  );
}
