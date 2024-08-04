// @ts-nocheck
"use client"
import { useEffect, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as En from 'blockly/msg/en';
import toolbox from '@/blocks/toolbox';
import {defineBlocks} from '@/blocks/blocks';
import * as BlocklyJS from 'blockly/javascript';

Blockly.setLocale(En);

function concatToBlocklyJS(blocks) {
  if (Array.isArray(blocks)) {
    blocks.forEach((block) => {
      if (block && block.type && block.javascriptGenerator) {
        BlocklyJS.javascriptGenerator.forBlock[block.type] = block.javascriptGenerator;
      }
    });
  } else {
    console.warn('defineBlocks did not return an array of blocks');
  }
}

export default function Home() {
  const [isJSX, setIsJSX] = useState(true);
  const [jsxCode, setJsxCode] = useState('');
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const onCmdEnter = (e) => {
      if (e.keyCode === 13 && e.metaKey) {
        const code = isJSX ? jsxCode : BlocklyJS.javascriptGenerator.workspaceToCode(workspace);
        alert(code);
        if (!isJSX) {
          eval(code);
        }
      }
    };
    document.addEventListener('keydown', onCmdEnter);
    return () => document.removeEventListener('keydown', onCmdEnter);
  }, [isJSX, jsxCode, workspace]);

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
                    type: 'my_custom_block'
                  }
                ]
              }
            ]
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
    <div className="flex flex-col h-screen">
      <div className="flex justify-center p-4">
        <button
          onClick={() => setIsJSX(!isJSX)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Switch to {isJSX ? 'Blocks' : 'JSX'}
        </button>
      </div>
      {isJSX ? (
        <div className="flex-grow p-4">
          <textarea
            value={jsxCode}
            onChange={(e) => setJsxCode(e.target.value)}
            className="w-full h-full p-2 border rounded"
            placeholder="Enter JSX here"
          />
        </div>
      ) : (
        <div id="blocklyDiv" className="flex-grow" />
      )}
    </div>
  );
}