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

export default function Home() {
  const [showCode, setShowCode] = useState(true);
  const [code, setCode] = useState(``);
  const [componentNames, setComponentNames] = useState([]);

  useEffect(() => {
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
          code = code.replace(`var ${stateName};`);
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

      if (!isJSX && blocklyDiv) {
        if (!workspace) {
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
    }
  }, [isJSX, workspace]);

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
