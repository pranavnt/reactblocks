// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import toolbox from '@/blocks/toolbox';
import { javascriptGenerator } from 'blockly/javascript';
import { LiveProvider, LiveEditor, LivePreview } from 'react-live';
import { defineBlocks } from '@/blocks/blocks';
import * as BlocklyJS from 'blockly/javascript';

Blockly.setLocale(En);

function concatToBlocklyJS(blocks) {
  if (Array.isArray(blocks)) {
    blocks.forEach((block) => {
      if (block && block.type && block.javascriptGenerator) {
        BlocklyJS.javascriptGenerator.forBlock[block.type] =
          block.javascriptGenerator;
      }
    });
  } else {
    console.warn('defineBlocks did not return an array of blocks');
  }
}

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const isCapitalized = (str: string) => {
  return str.charAt(0) === str.charAt(0).toUpperCase();
};

export default function Home() {
  const [showCode, setShowCode] = useState(true);
  const [code, setCode] = useState(``);
  const [componentNames, setComponentNames] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [view, setView] = useState('code');
  const [jsxCode, setJsxCode] = useState('');

  useEffect(() => {
    const onCmdEnter = (e) => {
      if (e.keyCode === 13) {
        let code = javascriptGenerator.workspaceToCode(workspace);

        const componentRegex =
          /function\s+(?<functionName>[a-zA-Z_]\w*)\s*\(\)\s*\{[\s\S]*?\}/gm;
        let match;
        let componentNames = [];
        while ((match = componentRegex.exec(code)) !== null) {
          if (isCapitalized(match.groups.functionName)) {
            componentNames.push(match.groups.functionName);
          }
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
          code = code.replace(`var ${stateName};`);
        }

        for (const componentName of componentNames) {
          componentNames[componentName] = `<${componentName} />`;
        }

        code = `${code}\n\nrender(<>${componentNames.join('\n')}</>);`;

        setComponentNames(componentNames);
        setCode(lines.join('\n'));
      }
    };
    document.addEventListener('keyup', onCmdEnter);
    return () => document.removeEventListener('keyup', onCmdEnter);
  }, [workspace]);

  useEffect(() => {
    const blocklyDiv = document.getElementById('blocklyDiv');

    if (blocklyDiv) {
      if (!blocklyDiv.hasChildNodes()) {
        // Define custom blocks
        const customBlocks = defineBlocks();

        // Add custom block to toolbox
        const updatedToolbox = {
          ...toolbox,
          contents: [
            ...toolbox.contents,
            {
              kind: 'category',
              name: 'Custom Blocks',
              contents: [
                {
                  kind: 'block',
                  type: 'my_custom_block',
                },
              ],
            },
          ],
        };

        const newWorkspace = Blockly.inject(blocklyDiv, {
          toolbox: updatedToolbox,
        });
        setWorkspace(newWorkspace);

        const onResize = () => Blockly.svgResize(newWorkspace);
        window.addEventListener('resize', onResize);

        // Define JavaScript generators for custom blocks
        concatToBlocklyJS(customBlocks);

        return () => {
          window.removeEventListener('resize', onResize);
        };
      }
    } else if (workspace) {
      workspace.dispose();
      setWorkspace(null);
    }
  }, [workspace]);

  return (
    <div className="flex flex-col h-screen">
      <div>
        <button
          style={{
            fontWeight: view === 'code' ? 'bold' : 'normal',
          }}
          className=" text-black px-4 py-2 rounded-md"
          onClick={() => setView('code')}
        >
          Code
        </button>
        |
        <button
          style={{
            fontWeight: view === 'preview' ? 'bold' : 'normal',
          }}
          className=" text-black px-4 py-2 rounded-md"
          onClick={() => setView('preview')}
        >
          Preview
        </button>
        |
        <button
          style={{
            fontWeight: view === 'jsx' ? 'bold' : 'normal',
          }}
          className=" text-black px-4 py-2 rounded-md"
          onClick={() => setView('jsx')}
        >
          JSX
        </button>
      </div>
      <div
        id="blocklyDiv"
        className="flex-grow"
        style={{
          height: '100vh',
          width: '100%',
          display: view === 'code' ? 'block' : 'none',
        }}
      ></div>
      <LiveProvider
        code={code}
        style={{
          height: '100vh',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          display: view === 'preview' ? 'block' : 'none',
        }}
      >
        <LiveEditor className="font-mono" />
        <LivePreview />
      </LiveProvider>
      <div
        className="flex-grow p-4"
        style={{ display: view === 'jsx' ? 'block' : 'none' }}
      >
        <textarea
          value={jsxCode}
          onChange={(e) => setJsxCode(e.target.value)}
          className="w-full h-full p-2 border rounded"
          placeholder="Enter JSX here"
        />
      </div>
    </div>
  );
}
